import { useCallback, useMemo } from "react";
import { DrugCohortItem } from "./useDrugCohort";

export const useDrugColorMatcher = (drugCohort: DrugCohortItem[]) => {
  const drugColorMap = useMemo(() => {
    const map = new Map<string, string>();

    drugCohort.forEach((item) => {
      map.set(item.drug_name.toLowerCase().trim(), item.color.toLowerCase());
    });

    return map;
  }, [drugCohort]);

  const getDrugColor = useCallback(
    (drugName: string | undefined | null): string => {
      if (!drugName || drugName === "--") {
        return "gray";
      }

      const normalizedDrugName = drugName.toLowerCase().trim();
      const color = drugColorMap.get(normalizedDrugName);

      return color || "gray";
    },
    [drugColorMap],
  );

  const isDrugInCohort = useCallback(
    (drugName: string | undefined | null): boolean => {
      if (!drugName || drugName === "--") {
        return false;
      }

      const normalizedDrugName = drugName.toLowerCase().trim();
      return drugColorMap.has(normalizedDrugName);
    },
    [drugColorMap],
  );

  return {
    getDrugColor,
    isDrugInCohort,
    drugColorMap,
  };
};
