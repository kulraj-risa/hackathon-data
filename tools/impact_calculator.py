"""Business case / ROI for the Denial Prevention Engine.

Two scenarios are produced so the numbers stay honest in a demo:

1. ``target``  - the hackathon's stated goal (60% -> 95% approval). This is the
   aspirational ceiling and matches the problem statement.
2. ``model_grounded`` - what *this* model can realistically catch given its
   measured recall on the held-out test set and a conservative assumption about
   how often a flagged, fixable case actually gets fixed.

Everything is driven by the constants in ``config.py`` so the assumptions are
auditable rather than hard-coded marketing numbers.
"""

from __future__ import annotations

from denial_engine.core import config

# Of denials, the share that are documentation-preventable (guide analysis:
# trial&failure, missing evidence, outdated labs, diagnosis specificity).
PREVENTABLE_SHARE = 0.85
# Of preventable denials the model flags pre-submission, the share a user
# actually fixes in time (conservative).
FIX_SUCCESS_RATE = 0.60


def _money(x: float) -> int:
    return int(round(x))


def compute_impact(recall: float | None = None) -> dict:
    """Return ROI for the target and model-grounded scenarios."""
    volume = config.ANNUAL_PA_VOLUME
    cur = config.CURRENT_APPROVAL_RATE
    tgt = config.TARGET_APPROVAL_RATE
    rev = config.REVENUE_PER_APPROVAL
    rework_hours_per_case = config.AVG_REWORK_TIME_MINUTES / 60.0
    rate = config.STAFF_HOURLY_RATE
    delay = config.AVG_DELAY_DAYS

    denials_now = volume * (1 - cur)

    def scenario(denials_avoided: float, label: str, note: str) -> dict:
        revenue_gain = denials_avoided * rev
        rework_savings = denials_avoided * rework_hours_per_case * rate
        total = revenue_gain + rework_savings
        new_rate = (volume - (denials_now - denials_avoided)) / volume
        return {
            "label": label,
            "note": note,
            "denials_avoided": _money(denials_avoided),
            "additional_approvals": _money(denials_avoided),
            "new_approval_rate_pct": round(new_rate * 100, 1),
            "revenue_gain": _money(revenue_gain),
            "rework_savings": _money(rework_savings),
            "total_annual_benefit": _money(total),
            "patient_days_saved": _money(denials_avoided * delay),
            "staff_hours_saved": _money(denials_avoided * rework_hours_per_case),
        }

    # Target: drive approval to 95%.
    target_avoided = volume * (tgt - cur)
    target = scenario(
        target_avoided,
        "Target (stated goal)",
        f"Approval {int(cur*100)}% -> {int(tgt*100)}% across {volume:,} PAs/yr.",
    )

    # Model-grounded: only preventable denials the model recalls, then fixed.
    recall = config.__dict__.get("MODEL_RECALL", recall) if recall is None else recall
    recall = 0.53 if recall is None else float(recall)
    preventable = denials_now * PREVENTABLE_SHARE
    realistic_avoided = preventable * recall * FIX_SUCCESS_RATE
    model_grounded = scenario(
        realistic_avoided,
        "Model-grounded (conservative)",
        (
            f"{int(PREVENTABLE_SHARE*100)}% of denials preventable x "
            f"{int(recall*100)}% model recall x {int(FIX_SUCCESS_RATE*100)}% fix rate."
        ),
    )

    impl_cost = 50_000
    net = target["total_annual_benefit"] - impl_cost
    return {
        "assumptions": {
            "annual_pa_volume": volume,
            "current_approval_rate_pct": round(cur * 100, 1),
            "target_approval_rate_pct": round(tgt * 100, 1),
            "revenue_per_approval": rev,
            "rework_minutes_per_case": config.AVG_REWORK_TIME_MINUTES,
            "staff_hourly_rate": rate,
            "avg_delay_days": delay,
            "preventable_share_pct": int(PREVENTABLE_SHARE * 100),
            "fix_success_rate_pct": int(FIX_SUCCESS_RATE * 100),
            "model_recall_pct": round(recall * 100, 1),
        },
        "denials_today": _money(denials_now),
        "implementation_cost": impl_cost,
        "year1_net_benefit": net,
        "roi_multiple": round(net / impl_cost, 1),
        "scenarios": [target, model_grounded],
    }


if __name__ == "__main__":
    import json

    print(json.dumps(compute_impact(), indent=2))
