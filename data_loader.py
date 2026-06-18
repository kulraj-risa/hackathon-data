"""Data loading utilities for BigQuery PA data.

Implements the three extraction queries from the implementation guide,
adapted to the *real* BigQuery schema:

  - Query 1: balanced training dataset (approved + denied)
  - Query 2: PA entries joined with questionnaire data
  - Query 3: denial-pattern statistics by drug class / payer (plan)

Schema notes (guide name -> real column):
  medication_class -> drug_class
  medication_name  -> drug_name
  payer_name       -> plan_name
  created_at       -> dumped_at
  submitted_at     -> updated_at
  questionnaire join: pa_request_entries.identifier = questionnaire_data.identifier
  total/answered question counts are derived from the nested `questions` array;
  per-question confidence lives at questions.api_response.confidence.
Columns are aliased back to the guide's names so downstream code is unchanged.
"""

import json
from typing import Optional

import pandas as pd
from google.cloud import bigquery

from config import (
    BIGQUERY_PROJECT,
    DATASET_PHARMACY,
    DATASET_ONCOEMR,
    TABLE_PA_ENTRIES,
    TABLE_QUESTIONNAIRES,
    DATA_DIR,
)


class DataLoader:
    """Load and preprocess PA data from BigQuery."""

    def __init__(self, project_id: str = BIGQUERY_PROJECT):
        """Initialize BigQuery client (uses Application Default Credentials)."""
        self.client = bigquery.Client(project=project_id)
        self.project_id = project_id

    # ------------------------------------------------------------------ #
    # Connection
    # ------------------------------------------------------------------ #
    def test_connection(self) -> bool:
        """Test BigQuery connection by counting PA entries."""
        try:
            query = f"""
            SELECT COUNT(*) AS count
            FROM `{self.project_id}.{DATASET_PHARMACY}.{TABLE_PA_ENTRIES}`
            """
            result = self.client.query(query).to_dataframe()
            count = int(result["count"].iloc[0])
            print(f"✅ BigQuery connection successful! Found {count:,} PA entries")
            return True
        except Exception as e:  # noqa: BLE001
            print(f"❌ BigQuery connection failed: {e}")
            return False

    # ------------------------------------------------------------------ #
    # Query 1 (+ Query 2 join): balanced training dataset
    # ------------------------------------------------------------------ #
    def load_training_dataset(
        self,
        n_samples: int = 10000,
        balanced: bool = True,
        save_to_disk: bool = True,
    ) -> pd.DataFrame:
        """Load a balanced training dataset, joined with questionnaire data.

        Args:
            n_samples: Total number of samples to load.
            balanced: If True load 60% approved / 40% denied (mirrors current state).
            save_to_disk: Persist result to ``data/training_data.parquet``.

        Returns:
            DataFrame with PA cases and questionnaire data.
        """
        print(f"📊 Loading {n_samples:,} PA cases from BigQuery...")

        if balanced:
            n_approved = int(n_samples * 0.6)
            n_denied = int(n_samples * 0.4)
        else:
            n_approved = n_denied = n_samples // 2

        query = f"""
        WITH questionnaires AS (
          -- one questionnaire per identifier (latest), with derived counts
          SELECT
            identifier,
            questions,
            ARRAY_LENGTH(questions) AS total_questions,
            (SELECT COUNT(*) FROM UNNEST(questions) x
               WHERE x.answer IS NOT NULL AND x.answer != '') AS answered_questions
          FROM `{self.project_id}.{DATASET_ONCOEMR}.{TABLE_QUESTIONNAIRES}`
          QUALIFY ROW_NUMBER() OVER (
            PARTITION BY identifier ORDER BY created_at DESC
          ) = 1
        ),
        approved_cases AS (
          SELECT
            e.identifier,
            e.covermymed_id,
            e.response_status,
            e.drug_name        AS medication_name,
            e.drug_class       AS medication_class,
            e.plan_name        AS payer_name,
            e.dumped_at        AS created_at,
            e.updated_at       AS submitted_at,
            q.questions,
            q.total_questions,
            q.answered_questions
          FROM `{self.project_id}.{DATASET_PHARMACY}.{TABLE_PA_ENTRIES}` e
          LEFT JOIN questionnaires q
            ON e.identifier = q.identifier
          WHERE e.response_status = 'Approved'
            AND e.second_stp_status = 'sent_to_plan'
            AND e.covermymed_id IS NOT NULL
          ORDER BY RAND()
          LIMIT {n_approved}
        ),
        denied_cases AS (
          SELECT
            e.identifier,
            e.covermymed_id,
            e.response_status,
            e.drug_name        AS medication_name,
            e.drug_class       AS medication_class,
            e.plan_name        AS payer_name,
            e.dumped_at        AS created_at,
            e.updated_at       AS submitted_at,
            q.questions,
            q.total_questions,
            q.answered_questions
          FROM `{self.project_id}.{DATASET_PHARMACY}.{TABLE_PA_ENTRIES}` e
          LEFT JOIN questionnaires q
            ON e.identifier = q.identifier
          WHERE e.response_status = 'Denied'
            AND e.second_stp_status = 'sent_to_plan'
            AND e.covermymed_id IS NOT NULL
          ORDER BY RAND()
          LIMIT {n_denied}
        )
        SELECT * FROM approved_cases
        UNION ALL
        SELECT * FROM denied_cases
        """

        df = self.client.query(query).to_dataframe()

        print(f"✅ Loaded {len(df):,} cases")
        print(f"   - Approved: {(df['response_status'] == 'Approved').sum():,}")
        print(f"   - Denied:   {(df['response_status'] == 'Denied').sum():,}")

        if save_to_disk and len(df):
            output_path = DATA_DIR / "training_data.parquet"
            df.to_parquet(output_path, index=False)
            print(f"💾 Saved to {output_path}")

        return df

    # ------------------------------------------------------------------ #
    # Query 2: PA entries joined with questionnaire data
    # ------------------------------------------------------------------ #
    def load_pa_with_questionnaires(self, limit: int = 10000) -> pd.DataFrame:
        """Get PA entries with their full questionnaire data (Query 2)."""
        print(f"📊 Loading up to {limit:,} PA entries joined with questionnaires...")
        query = f"""
        SELECT
          e.identifier,
          e.covermymed_id,
          e.response_status,
          e.drug_name   AS medication_name,
          e.drug_class  AS medication_class,
          e.plan_name   AS payer_name,
          q.questions,
          ARRAY_LENGTH(q.questions) AS total_questions,
          (SELECT COUNT(*) FROM UNNEST(q.questions) x
             WHERE x.answer IS NOT NULL AND x.answer != '') AS answered_questions
        FROM `{self.project_id}.{DATASET_PHARMACY}.{TABLE_PA_ENTRIES}` e
        JOIN `{self.project_id}.{DATASET_ONCOEMR}.{TABLE_QUESTIONNAIRES}` q
          ON e.identifier = q.identifier
        WHERE e.response_status IN ('Approved', 'Denied')
          AND e.second_stp_status = 'sent_to_plan'
        LIMIT {limit}
        """
        df = self.client.query(query).to_dataframe()
        print(f"✅ Loaded {len(df):,} joined rows")
        return df

    # ------------------------------------------------------------------ #
    # Query 3: denial-pattern statistics
    # ------------------------------------------------------------------ #
    def get_denial_statistics(self, limit: int = 50, min_cases: int = 10) -> pd.DataFrame:
        """Analyze denial patterns by medication class and payer (Query 3)."""
        query = f"""
        SELECT
          drug_class AS medication_class,
          plan_name  AS payer_name,
          COUNT(*) AS total_cases,
          SUM(CASE WHEN response_status = 'Denied' THEN 1 ELSE 0 END) AS denials,
          ROUND(
            SUM(CASE WHEN response_status = 'Denied' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1
          ) AS denial_rate
        FROM `{self.project_id}.{DATASET_PHARMACY}.{TABLE_PA_ENTRIES}`
        WHERE response_status IN ('Approved', 'Denied')
          AND second_stp_status = 'sent_to_plan'
        GROUP BY drug_class, plan_name
        HAVING total_cases >= {min_cases}
        ORDER BY denial_rate DESC
        LIMIT {limit}
        """
        df = self.client.query(query).to_dataframe()
        print("📊 Denial Statistics (top 10):")
        print(df.head(10).to_string(index=False))
        return df

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    def load_from_disk(self, filename: str = "training_data.parquet") -> pd.DataFrame:
        """Load a previously saved dataset from disk."""
        file_path = DATA_DIR / filename
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        df = pd.read_parquet(file_path)
        print(f"📂 Loaded {len(df):,} cases from {file_path}")
        return df

    @staticmethod
    def parse_questions(questions_json) -> list:
        """Parse a questions JSON value into a list of dicts."""
        if questions_json is None:
            return []
        if isinstance(questions_json, list):
            return list(questions_json)
        if isinstance(questions_json, str):
            try:
                return json.loads(questions_json)
            except (ValueError, TypeError):
                return []
        return []


# Example usage
if __name__ == "__main__":
    loader = DataLoader()

    if loader.test_connection():
        # Query 3: denial statistics (lightweight, runs first as a sanity check)
        stats = loader.get_denial_statistics()

        # Query 1 + 2: balanced training dataset joined with questionnaires
        df = loader.load_training_dataset(n_samples=10000, balanced=True)
