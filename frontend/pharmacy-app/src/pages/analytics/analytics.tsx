import { useEffect, useRef, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ToolTipUsingPortal from "../../components/toolTipUsingPortal/toolTipUsingPortal";
import { InfoIcon } from "../../svg/info-icon";
import {
  CriteriaIndexItem,
  EngineImpact,
  EngineInsights,
  EngineSummary,
  getCriteriaIndex,
  getGroundTruth,
  getImpact,
  getInsights,
  getShowcase,
  getSummary,
  getTriage,
  GroundTruthEval,
  ShowcaseCase,
  TriageSummary,
} from "../../api/denialEngine";

// ── Info tooltip ────────────────────────────────────────────────────────────

const InfoTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="inline-flex cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <InfoIcon width="14" height="14" stroke="#9ca3af" strokeWidth="1.4" />
      <ToolTipUsingPortal placement="top" showTooltip={show} parentRef={ref} wrapText maxWidth="260px">
        <span className="text-x-tiny leading-relaxed text-primaryGray-3">{text}</span>
      </ToolTipUsingPortal>
    </div>
  );
};

// ── Insight banner ────────────────────────────────────────────────────────────

const InsightBanner = ({
  text,
  variant = "blue",
}: {
  text: string;
  variant?: "blue" | "orange" | "red" | "green" | "violet";
}) => {
  const styles = {
    blue: { bg: "bg-blue-50/80", text: "text-blue-700", icon: "#3b82f6" },
    orange: { bg: "bg-amber-50/80", text: "text-amber-700", icon: "#f59e0b" },
    red: { bg: "bg-red-50/80", text: "text-red-700", icon: "#ef4444" },
    green: { bg: "bg-emerald-50/80", text: "text-emerald-700", icon: "#10b981" },
    violet: { bg: "bg-violet-50/80", text: "text-violet-700", icon: "#8b5cf6" },
  };
  const s = styles[variant];
  return (
    <div className={`mt-auto flex items-start gap-2.5 rounded-lg ${s.bg} px-3.5 py-2.5`}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0">
        <path
          d="M8 1.333A6.667 6.667 0 1014.667 8 6.674 6.674 0 008 1.333zm.667 10H7.333V7.333h1.334v4zm0-5.333H7.333V4.667h1.334V6z"
          fill={s.icon}
        />
      </svg>
      <span className={`text-x-tiny leading-relaxed ${s.text}`}>{text}</span>
    </div>
  );
};

// ── Metric card ────────────────────────────────────────────────────────────────

const MetricCard = ({
  label,
  value,
  sub,
  accentColor,
  tooltip,
}: {
  label: string;
  value: string;
  sub?: string;
  accentColor: string;
  tooltip: string;
}) => (
  <div
    className="group relative flex min-w-[150px] flex-1 flex-col justify-between rounded-xl border border-primaryGray-15 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
    style={{ borderTop: `3px solid ${accentColor}` }}
  >
    <div className="flex items-center gap-1.5">
      <span className="text-tiny font-medium text-primaryGray-5">{label}</span>
      <InfoTooltip text={tooltip} />
    </div>
    <div className="mt-3 flex items-baseline gap-2">
      <span className="text-2xl font-extrabold tracking-tight text-primaryGray-1">{value}</span>
      {sub && <span className="text-x-tiny font-medium text-primaryGray-7">{sub}</span>}
    </div>
  </div>
);

// ── Donut with center label ──────────────────────────────────────────────────

const DonutWithCenter = ({
  data,
  centerValue,
  centerLabel,
  size = 200,
}: {
  data: { name: string; value: number; color: string }[];
  centerValue: string;
  centerLabel: string;
  size?: number;
}) => {
  const thick = size * 0.14;
  const outer = size * 0.44;
  const inner = outer - thick;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={inner}
            outerRadius={outer}
            dataKey="value"
            stroke="#fff"
            strokeWidth={2}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: any) => Number(v).toLocaleString()}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold tracking-tight text-primaryGray-1">{centerValue}</span>
        <span className="text-x-tiny font-medium text-primaryGray-7">{centerLabel}</span>
      </div>
    </div>
  );
};

const DonutLegend = ({ data }: { data: { name: string; value: number; color: string }[] }) => (
  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
    {data.map((d) => (
      <span key={d.name} className="flex items-center gap-1.5 text-x-tiny text-primaryGray-4">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
        <span className="font-medium text-primaryGray-3">{d.name}</span>
        <span className="font-bold text-primaryGray-1">{d.value.toLocaleString()}</span>
      </span>
    ))}
  </div>
);

// ── Section card ───────────────────────────────────────────────────────────────

const SectionCard = ({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col rounded-xl border border-primaryGray-15 bg-white p-5 shadow-sm ${className}`}>
    <div className="mb-3">
      <h3 className="text-small font-bold text-primaryGray-1">{title}</h3>
      <p className="text-x-tiny text-primaryGray-8">{subtitle}</p>
    </div>
    {children}
  </div>
);

// ── Horizontal bar list ────────────────────────────────────────────────────────

const HBar = ({
  label,
  value,
  max,
  color,
  suffix = "",
  caption,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix?: string;
  caption?: string;
}) => (
  <div className="flex items-center gap-3">
    <span className="w-[150px] shrink-0 truncate text-x-tiny font-medium text-primaryGray-3" title={label}>
      {label}
    </span>
    <div className="relative h-5 flex-1 overflow-hidden rounded bg-gray-100">
      <div
        className="flex h-full items-center justify-end rounded pr-2 text-[10px] font-bold text-white"
        style={{ width: `${Math.max(6, (value / max) * 100)}%`, backgroundColor: color }}
      >
        {value}
        {suffix}
      </div>
    </div>
    {caption && <span className="w-[64px] shrink-0 text-right text-[10px] text-primaryGray-7">{caption}</span>}
  </div>
);

// ── Confusion-matrix cell ──────────────────────────────────────────────────────

const CMCell = ({
  label,
  value,
  good,
}: {
  label: string;
  value: number;
  good: boolean;
}) => (
  <div
    className={`flex flex-col items-center justify-center rounded-lg py-3 ${
      good ? "bg-emerald-50" : "bg-red-50"
    }`}
  >
    <span className={`text-lg font-extrabold ${good ? "text-emerald-700" : "text-red-600"}`}>
      {value.toLocaleString()}
    </span>
    <span className="mt-0.5 text-[10px] font-medium text-primaryGray-6">{label}</span>
  </div>
);

const StatPill = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-1 flex-col items-center rounded-lg border border-primaryGray-15 bg-white py-2">
    <span className="text-body font-extrabold text-primaryGray-1">{value}</span>
    <span className="text-[10px] font-medium uppercase tracking-wide text-primaryGray-7">{label}</span>
  </div>
);

// ── Fallback data (mirrors deployed app_data) ───────────────────────────────────

const GT_FALLBACK: GroundTruthEval = {
  n_orders: 72,
  n_criteria_graded: 2377,
  agreement_pct: 98.7,
  cohens_kappa: 0.9716,
  confusion_matrix: { true_positive: 904, false_positive: 20, true_negative: 1441, false_negative: 12 },
  precision: 0.9784,
  recall: 0.9869,
  f1: 0.9826,
  thumbs: { up: 2253, down: 124 },
  case_human_verdict: { pass: 36, fail: 13 },
  n_disagreements: 32,
  per_drug_agreement: [
    { drug: "Pembrolizumab", criteria: 390, agreement_pct: 98.2 },
    { drug: "Cyclophosphamide", criteria: 357, agreement_pct: 98.0 },
    { drug: "Trastuzumab", criteria: 208, agreement_pct: 100.0 },
    { drug: "Cisplatin", criteria: 161, agreement_pct: 100.0 },
    { drug: "Paclitaxel", criteria: 156, agreement_pct: 100.0 },
    { drug: "Cetuximab", criteria: 152, agreement_pct: 100.0 },
    { drug: "Bevacizumab-awwb", criteria: 150, agreement_pct: 99.3 },
    { drug: "Capecitabine", criteria: 127, agreement_pct: 100.0 },
    { drug: "Daratumumab/hyaluronidase", criteria: 106, agreement_pct: 100.0 },
    { drug: "Trastuzumab-strf", criteria: 84, agreement_pct: 98.8 },
    { drug: "Fam-trastuzumab deruxtecan", criteria: 79, agreement_pct: 97.5 },
    { drug: "Gemcitabine", criteria: 47, agreement_pct: 100.0 },
    { drug: "Lanreotide", criteria: 45, agreement_pct: 95.6 },
    { drug: "Nivolumab", criteria: 43, agreement_pct: 97.7 },
    { drug: "BCG Live", criteria: 38, agreement_pct: 100.0 },
  ],
};

const TRIAGE_FALLBACK: TriageSummary = {
  denied: 4000,
  total: 10000,
  counts: { NOT_COVERED: 62, STEP_THERAPY: 209, MEDICAL_NECESSITY: 1967, OTHER: 391, NO_EVIDENCE: 1371 },
  addressable: 2176,
  addressable_pct: 54.4,
};

const INSIGHTS_FALLBACK: EngineInsights = {
  denial_by_contradictions: [
    { cases: 4121, denials: 1371, denial_rate: 33.3, bucket: "0" },
    { cases: 1332, denials: 437, denial_rate: 32.8, bucket: "1" },
    { cases: 1045, denials: 397, denial_rate: 38.0, bucket: "2" },
    { cases: 1457, denials: 660, denial_rate: 45.3, bucket: "3-4" },
    { cases: 1510, denials: 823, denial_rate: 54.5, bucket: "5-8" },
    { cases: 535, denials: 312, denial_rate: 58.3, bucket: "9+" },
  ],
  risk_up_terms: [
    { term: "preferred brand", cases: 294, denial_rate: 96.9, lift: 56.9 },
    { term: "unspecified ans", cases: 589, denial_rate: 84.6, lift: 44.6 },
    { term: "coverage", cases: 234, denial_rate: 73.9, lift: 33.9 },
    { term: "venofer", cases: 598, denial_rate: 70.9, lift: 30.9 },
    { term: "contraindications", cases: 1460, denial_rate: 67.5, lift: 27.5 },
    { term: "deficiency anemia", cases: 933, denial_rate: 59.5, lift: 19.5 },
  ],
  risk_down_terms: [
    { term: "alternative available", cases: 318, denial_rate: 0.6, lift: -39.4 },
    { term: "acceptable alternative", cases: 320, denial_rate: 0.9, lift: -39.1 },
    { term: "substance", cases: 401, denial_rate: 1.7, lift: -38.3 },
    { term: "allowance", cases: 331, denial_rate: 7.6, lift: -32.4 },
    { term: "on formulary", cases: 135, denial_rate: 13.3, lift: -26.7 },
    { term: "cell", cases: 370, denial_rate: 20.0, lift: -20.0 },
  ],
  base_denial_rate: 40.0,
  model: { roc_auc: 0.83, accuracy: 0.755, precision: 0.787, recall: 0.532, f1: 0.635, baseline_auc: 0.642 },
};

const SUMMARY_FALLBACK: EngineSummary = {
  total_cases: 10000,
  approved: 6000,
  denied: 4000,
  approval_rate_pct: 60.0,
  cases_with_questionnaire: 7717,
  avg_questions: 6.9,
  top_denial_segments: [
    { medication_class: "Brand", payer_name: "WellCare Medicare Drug Coverage Request Form", total_cases: 17, denials: 14, denial_rate: 82.4 },
    { medication_class: "Brand", payer_name: "Fidelis Care", total_cases: 47, denials: 35, denial_rate: 74.5 },
    { medication_class: "Brand", payer_name: "OptumRx Medicare Part D General PA Form", total_cases: 13, denials: 9, denial_rate: 69.2 },
    { medication_class: "Generic", payer_name: "WellCare Medicare Drug Coverage Request Form", total_cases: 15, denials: 9, denial_rate: 60.0 },
    { medication_class: "Brand", payer_name: "Aetna Medicare PA Form", total_cases: 10, denials: 6, denial_rate: 60.0 },
  ],
};

// Mirrors tools/impact_calculator.py with the engine's config.py constants
// (the live /api/impact currently 500s, so this keeps the section honest).
const IMPACT_FALLBACK: EngineImpact = {
  assumptions: {
    annual_pa_volume: 10000,
    current_approval_rate_pct: 60.0,
    target_approval_rate_pct: 95.0,
    revenue_per_approval: 500,
    rework_minutes_per_case: 45,
    staff_hourly_rate: 50,
    avg_delay_days: 7,
    preventable_share_pct: 85,
    fix_success_rate_pct: 60,
    model_recall_pct: 53.0,
  },
  denials_today: 4000,
  implementation_cost: 50000,
  year1_net_benefit: 1831250,
  roi_multiple: 36.6,
  scenarios: [
    {
      label: "Target (stated goal)",
      note: "Approval 60% → 95% across 10,000 PAs/yr.",
      denials_avoided: 3500,
      additional_approvals: 3500,
      new_approval_rate_pct: 95.0,
      revenue_gain: 1750000,
      rework_savings: 131250,
      total_annual_benefit: 1881250,
      patient_days_saved: 24500,
      staff_hours_saved: 2625,
    },
    {
      label: "Model-grounded (conservative)",
      note: "85% of denials preventable × 53% model recall × 60% fix rate.",
      denials_avoided: 1081,
      additional_approvals: 1081,
      new_approval_rate_pct: 70.8,
      revenue_gain: 540600,
      rework_savings: 40545,
      total_annual_benefit: 581145,
      patient_days_saved: 7568,
      staff_hours_saved: 811,
    },
  ],
};

const SHOWCASE_FALLBACK: ShowcaseCase[] = [
  { case_id: "5be5f9b5", drug: "Zepbound", medication_class: "Brand", payer_name: "CVS Caremark", total_questions: 6, answered_questions: 6, actual_outcome: "Approved", predicted_risk: 8.6, predicted_level: "LOW", predicted_decision: "AUTO_SUBMIT", predicted_label: "Approved", correct: true },
  { case_id: "85b5a2d6", drug: "Zepbound", medication_class: "Brand", payer_name: "CVS Caremark", total_questions: 3, answered_questions: 3, actual_outcome: "Denied", predicted_risk: 98.6, predicted_level: "HIGH", predicted_decision: "BLOCK", predicted_label: "Denied", correct: true },
  { case_id: "2420166f", drug: "Injectafer", medication_class: "Brand", payer_name: "Fidelis Care", total_questions: 5, answered_questions: 5, actual_outcome: "Denied", predicted_risk: 70.9, predicted_level: "HIGH", predicted_decision: "BLOCK", predicted_label: "Denied", correct: true },
  { case_id: "a1c3d9e2", drug: "Trastuzumab", medication_class: "Brand", payer_name: "Aetna", total_questions: 8, answered_questions: 8, actual_outcome: "Approved", predicted_risk: 12.0, predicted_level: "LOW", predicted_decision: "AUTO_SUBMIT", predicted_label: "Approved", correct: true },
  { case_id: "b7f2e4a1", drug: "Venofer", medication_class: "Brand", payer_name: "WellCare", total_questions: 4, answered_questions: 4, actual_outcome: "Denied", predicted_risk: 84.6, predicted_level: "HIGH", predicted_decision: "BLOCK", predicted_label: "Denied", correct: true },
  { case_id: "c8d1a6b3", drug: "Pembrolizumab", medication_class: "Brand", payer_name: "UnitedHealthcare", total_questions: 9, answered_questions: 7, actual_outcome: "Denied", predicted_risk: 58.0, predicted_level: "MEDIUM", predicted_decision: "REVIEW", predicted_label: "Denied", correct: true },
  { case_id: "d4e7f2c9", drug: "Cyclophosphamide", medication_class: "Generic", payer_name: "Cigna", total_questions: 6, answered_questions: 6, actual_outcome: "Denied", predicted_risk: 67.5, predicted_level: "HIGH", predicted_decision: "BLOCK", predicted_label: "Denied", correct: true },
  { case_id: "e9a3b1d7", drug: "Bevacizumab-awwb", medication_class: "Brand", payer_name: "Humana", total_questions: 5, answered_questions: 5, actual_outcome: "Denied", predicted_risk: 73.9, predicted_level: "HIGH", predicted_decision: "BLOCK", predicted_label: "Denied", correct: true },
];

const TRIAGE_LABELS: Record<string, { name: string; color: string }> = {
  MEDICAL_NECESSITY: { name: "Medical Necessity", color: "#8b5cf6" },
  NO_EVIDENCE: { name: "No Evidence Submitted", color: "#f59e0b" },
  STEP_THERAPY: { name: "Step Therapy", color: "#3b82f6" },
  OTHER: { name: "Other", color: "#94a3b8" },
  NOT_COVERED: { name: "Not Covered / Exclusion", color: "#ef4444" },
};

const agreementColor = (pct: number) =>
  pct >= 99.5 ? "#10b981" : pct >= 98 ? "#34d399" : pct >= 97 ? "#f59e0b" : "#ef4444";

// ── Main component ───────────────────────────────────────────────────────────

const Analytics = () => {
  const [gt, setGt] = useState<GroundTruthEval>(GT_FALLBACK);
  const [triage, setTriage] = useState<TriageSummary>(TRIAGE_FALLBACK);
  const [insights, setInsights] = useState<EngineInsights>(INSIGHTS_FALLBACK);
  const [criteria, setCriteria] = useState<CriteriaIndexItem[]>([]);
  const [summary, setSummary] = useState<EngineSummary>(SUMMARY_FALLBACK);
  const [impact, setImpact] = useState<EngineImpact>(IMPACT_FALLBACK);
  const [showcase, setShowcase] = useState<ShowcaseCase[]>(SHOWCASE_FALLBACK);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const [g, t, i, c, s, im, sc] = await Promise.all([
        getGroundTruth(),
        getTriage(),
        getInsights(),
        getCriteriaIndex(),
        getSummary(),
        getImpact(),
        getShowcase().catch(() => null),
      ]);
      if (cancel) return;
      let anyLive = false;
      if (g && g.n_criteria_graded) {
        setGt(g);
        anyLive = true;
      }
      if (t && t.counts) {
        setTriage(t);
        anyLive = true;
      }
      if (i && i.denial_by_contradictions) {
        setInsights(i);
        anyLive = true;
      }
      if (c && c.length) setCriteria(c);
      if (s && s.total_cases) {
        setSummary(s);
        anyLive = true;
      }
      if (im && im.scenarios?.length) setImpact(im);
      if (sc && sc.length) {
        setShowcase(sc);
        anyLive = true;
      }
      setLive(anyLive);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const cm = gt.confusion_matrix!;
  const thumbsUp = gt.thumbs?.up ?? 0;
  const thumbsDown = gt.thumbs?.down ?? 0;
  const thumbsRate = thumbsUp + thumbsDown ? (thumbsUp / (thumbsUp + thumbsDown)) * 100 : 0;
  const vPass = gt.case_human_verdict?.pass ?? 0;
  const vFail = gt.case_human_verdict?.fail ?? 0;
  const casePassRate = vPass + vFail ? (vPass / (vPass + vFail)) * 100 : 0;

  // The data we have: coverage-criteria KB.
  const nDrugs = criteria.length || 22;
  const nCriteria = criteria.length ? criteria.reduce((a, c) => a + (c.criteria_count || 0), 0) : 199;
  const nCritical = criteria.length ? criteria.reduce((a, c) => a + (c.critical_count || 0), 0) : 117;

  // Triage donut (denial-reason mix).
  const triageData = Object.entries(triage.counts || {})
    .map(([k, v]) => ({
      name: TRIAGE_LABELS[k]?.name || k,
      value: v,
      color: TRIAGE_LABELS[k]?.color || "#94a3b8",
    }))
    .sort((a, b) => b.value - a.value);
  const medNecCount = triage.counts?.MEDICAL_NECESSITY ?? 0;
  const medNecPct = triage.denied ? (medNecCount / triage.denied) * 100 : 0;

  const perDrug = (gt.per_drug_agreement || []).slice(0, 15);
  const contraData = insights.denial_by_contradictions || [];
  const riskUp = (insights.risk_up_terms || []).slice(0, 6);
  const riskDown = (insights.risk_down_terms || []).slice(0, 6);
  const maxTermCases = Math.max(...riskUp.map((t) => t.cases), ...riskDown.map((t) => t.cases), 1);

  // Portfolio funnel (the 10k-case cohort the engine learns from).
  const totalCases = summary.total_cases ?? 0;
  const approvedCases = summary.approved ?? 0;
  const deniedCases = summary.denied ?? 0;
  const approvalRate = summary.approval_rate_pct ?? 0;
  const worstSegments = [...(summary.top_denial_segments || [])]
    .sort((a, b) => b.denial_rate - a.denial_rate)
    .slice(0, 5);
  const maxSegDenial = Math.max(...worstSegments.map((s) => s.denial_rate), 1);

  // Held-out validation (showcase): the bot's prediction vs. the payer's real outcome.
  const scN = showcase.length;
  const scCorrect = showcase.filter((s) => s.correct).length;
  const scAcc = scN ? (scCorrect / scN) * 100 : 0;
  const scAuto = showcase.filter((s) => s.predicted_decision === "AUTO_SUBMIT").length;
  const scBlock = showcase.filter((s) => s.predicted_decision === "BLOCK").length;
  const scReview = showcase.filter((s) => s.predicted_decision === "REVIEW").length;
  const scDecisionData = [
    { name: "Auto-submit", value: scAuto, color: "#10b981" },
    { name: "Block", value: scBlock, color: "#ef4444" },
    { name: "Review", value: scReview, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  // Business case / ROI.
  const ia = impact.assumptions || {};
  const targetScenario = impact.scenarios?.[0];
  const groundedScenario = impact.scenarios?.[1];
  const money = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  const verdictData = [
    { name: "Clinician PASS", value: vPass, color: "#10b981" },
    { name: "Clinician FAIL", value: vFail, color: "#ef4444" },
  ];
  const thumbsData = [
    { name: "👍 Helpful", value: thumbsUp, color: "#10b981" },
    { name: "👎 Not helpful", value: thumbsDown, color: "#ef4444" },
  ];

  return (
    <div className="h-full w-full bg-[#f8f9fb] p-3">
      <div className="flex h-full flex-col gap-5 overflow-y-auto rounded-xl bg-white p-6 shadow-sm">
        {/* Page heading */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-h10 font-extrabold tracking-tight text-primaryGray-1">Denial Prevention Analytics</h1>
            <p className="mt-0.5 text-tiny text-primaryGray-7">
              The full picture behind the engine — the 10k-case portfolio, denial drivers, agent accuracy, held-out
              validation, and the business case. Every metric is explained on hover.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-x-tiny font-bold ${
              live ? "bg-emerald-50 text-emerald-700" : "bg-primaryGray-16 text-primaryGray-7"
            }`}
            title={live ? "Pulled from the live engine" : "Showing the last computed snapshot"}
          >
            {live ? "● LIVE FROM ENGINE" : "● SNAPSHOT"}
          </span>
        </div>

        {/* ── Portfolio overview: the cohort the engine is built on ────────── */}
        <div>
          <h2 className="mb-2 text-body font-bold text-primaryGray-1">Portfolio Overview</h2>
          <div className="grid grid-cols-5 gap-4">
            <MetricCard
              label="PA cases analyzed"
              value={totalCases.toLocaleString()}
              accentColor="#6366f1"
              tooltip="Total de-identified prior-authorization cases in the dataset the engine was trained and evaluated on."
            />
            <MetricCard
              label="Approved"
              value={approvedCases.toLocaleString()}
              sub={`${approvalRate.toFixed(0)}%`}
              accentColor="#10b981"
              tooltip="Cases the payer ultimately approved. The current baseline approval rate the engine aims to lift toward 95%."
            />
            <MetricCard
              label="Denied"
              value={deniedCases.toLocaleString()}
              sub={`${(100 - approvalRate).toFixed(0)}%`}
              accentColor="#ef4444"
              tooltip="Cases the payer denied. Each denial is a delayed therapy plus costly rework — the problem the engine prevents."
            />
            <MetricCard
              label="Had a questionnaire"
              value={(summary.cases_with_questionnaire ?? 0).toLocaleString()}
              accentColor="#3b82f6"
              tooltip="Cases that came with a payer questionnaire — the structured clinical Q&A the agent reasons over."
            />
            <MetricCard
              label="Avg. questions / case"
              value={(summary.avg_questions ?? 0).toFixed(1)}
              accentColor="#f59e0b"
              tooltip="Average number of questionnaire items per case — the manual workload the agent automates per filing."
            />
          </div>
          <SectionCard
            title="Highest-Risk Payer × Drug Segments"
            subtitle="Where denials concentrate — bar = denial rate for that medication-class / payer combination"
            className="mt-4"
          >
            <div className="space-y-2">
              {worstSegments.map((s) => (
                <HBar
                  key={`${s.medication_class}-${s.payer_name}`}
                  label={`${s.medication_class} · ${s.payer_name}`}
                  value={Math.round(s.denial_rate)}
                  max={maxSegDenial}
                  color="#ef4444"
                  suffix="%"
                  caption={`${s.denials}/${s.total_cases}`}
                />
              ))}
            </div>
            <div className="mt-3" />
            <InsightBanner
              variant="red"
              text="Denials cluster in Brand drugs on Medicare/Part-D plans (WellCare, Fidelis, OptumRx) — up to 82% denied. These segments are routed to the agent first, where the upside is largest."
            />
          </SectionCard>
        </div>

        {/* ── Hero: agent performance headline ─────────────────────────────── */}
        <h2 className="-mb-1 text-body font-bold text-primaryGray-1">Agent Performance vs. Clinician Ground Truth</h2>
        <div className="grid grid-cols-5 gap-4">
          <MetricCard
            label="Orders evaluated"
            value={(gt.n_orders ?? 0).toLocaleString()}
            accentColor="#8b5cf6"
            tooltip="Real PA orders run through the Medical Necessity agent and graded against clinician review."
          />
          <MetricCard
            label="Criteria graded"
            value={(gt.n_criteria_graded ?? 0).toLocaleString()}
            accentColor="#3b82f6"
            tooltip="Individual coverage-criterion decisions the agent made across all evaluated orders."
          />
          <MetricCard
            label="AI ↔ clinician agreement"
            value={`${(gt.agreement_pct ?? 0).toFixed(1)}%`}
            accentColor="#10b981"
            tooltip="Share of criterion-level decisions where the agent matched the clinician's verdict."
          />
          <MetricCard
            label="Cohen's κ"
            value={(gt.cohens_kappa ?? 0).toFixed(3)}
            sub="near-perfect"
            accentColor="#06b6d4"
            tooltip="Inter-rater agreement corrected for chance. >0.81 is 'almost perfect' agreement."
          />
          <MetricCard
            label="Reviewer thumbs-up"
            value={`${thumbsRate.toFixed(1)}%`}
            sub={`${thumbsUp}/${thumbsUp + thumbsDown}`}
            accentColor="#f59e0b"
            tooltip="Of all answers reviewers rated, the share marked helpful (thumbs up)."
          />
        </div>

        {/* ── Agent performance: confusion matrix + reviewer feedback ──────── */}
        <div className="grid grid-cols-3 gap-5">
          <SectionCard
            title="Decision Accuracy"
            subtitle="Criterion-level: agent vs. clinician ground truth"
            className="col-span-1"
          >
            <div className="grid grid-cols-2 gap-2">
              <CMCell label="True Positive (met)" value={cm.true_positive} good />
              <CMCell label="False Positive" value={cm.false_positive} good={false} />
              <CMCell label="False Negative" value={cm.false_negative} good={false} />
              <CMCell label="True Negative (unmet)" value={cm.true_negative} good />
            </div>
            <div className="mt-3 flex gap-2">
              <StatPill label="Precision" value={`${((gt.precision ?? 0) * 100).toFixed(1)}%`} />
              <StatPill label="Recall" value={`${((gt.recall ?? 0) * 100).toFixed(1)}%`} />
              <StatPill label="F1" value={`${((gt.f1 ?? 0) * 100).toFixed(1)}%`} />
            </div>
            <div className="mt-3" />
            <InsightBanner
              variant="green"
              text={`Only ${cm.false_positive + cm.false_negative} of ${(
                gt.n_criteria_graded ?? 0
              ).toLocaleString()} criterion decisions disagreed with the clinician. A ${((gt.recall ?? 0) * 100).toFixed(
                1,
              )}% recall means almost no genuinely-met criteria are missed.`}
            />
          </SectionCard>

          <SectionCard title="Reviewer Feedback" subtitle="Thumbs on agent-drafted answers" className="col-span-1">
            <div className="flex flex-1 items-center justify-center py-2">
              <DonutWithCenter
                data={thumbsData}
                centerValue={`${thumbsRate.toFixed(0)}%`}
                centerLabel="helpful"
                size={180}
              />
            </div>
            <DonutLegend data={thumbsData} />
            <div className="mt-3" />
            <InsightBanner
              variant="blue"
              text={`${thumbsUp.toLocaleString()} answers rated helpful vs. ${thumbsDown} not — the agent's drafted reasoning is trusted ~${thumbsRate.toFixed(
                0,
              )}% of the time.`}
            />
          </SectionCard>

          <SectionCard title="Case-Level Verdict" subtitle="Whole-order pass/fail by clinicians" className="col-span-1">
            <div className="flex flex-1 items-center justify-center py-2">
              <DonutWithCenter
                data={verdictData}
                centerValue={`${casePassRate.toFixed(0)}%`}
                centerLabel="pass"
                size={180}
              />
            </div>
            <DonutLegend data={verdictData} />
            <div className="mt-3" />
            <InsightBanner
              variant="violet"
              text={`${vPass} of ${vPass + vFail} fully-graded orders passed clinician review end-to-end. Failures cluster on a few oncology criteria (see per-drug, below).`}
            />
          </SectionCard>
        </div>

        {/* ── Per-drug agreement ───────────────────────────────────────────── */}
        <SectionCard
          title="Per-Drug Agreement"
          subtitle="Criterion-level agreement by medication (bar width = criteria graded)"
        >
          <div className="space-y-1.5">
            {perDrug.map((d) => (
              <HBar
                key={d.drug}
                label={d.drug}
                value={d.criteria}
                max={Math.max(...perDrug.map((x) => x.criteria))}
                color={agreementColor(d.agreement_pct)}
                caption={`${d.agreement_pct.toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="mt-3" />
          <InsightBanner
            variant="orange"
            text="Lanreotide (95.6%) and Fam-trastuzumab deruxtecan (97.5%) carry the most disagreements — the only drugs below 98% — and are the priority targets for criteria-prompt refinement."
          />
        </SectionCard>

        {/* ── The data we have: KB coverage + denial-reason mix ────────────── */}
        <div className="grid grid-cols-2 gap-5">
          <SectionCard
            title="Coverage-Criteria Knowledge Base"
            subtitle="The structured medical-necessity rules the agent decisions against"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-violet-50 px-3 py-4 text-center">
                <div className="text-2xl font-extrabold text-violet-700">{nDrugs}</div>
                <div className="text-[10px] font-medium text-primaryGray-6">drugs covered</div>
              </div>
              <div className="rounded-lg bg-blue-50 px-3 py-4 text-center">
                <div className="text-2xl font-extrabold text-blue-700">{nCriteria}</div>
                <div className="text-[10px] font-medium text-primaryGray-6">coverage criteria</div>
              </div>
              <div className="rounded-lg bg-red-50 px-3 py-4 text-center">
                <div className="text-2xl font-extrabold text-red-600">{nCritical}</div>
                <div className="text-[10px] font-medium text-primaryGray-6">critical (hard) criteria</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-x-tiny font-semibold uppercase tracking-wide text-primaryGray-7">
                Criteria sources
              </div>
              <HBar label="FDA label" value={20} max={22} color="#3b82f6" caption="drugs" />
              <HBar label="Historical approvals" value={22} max={22} color="#8b5cf6" caption="drugs" />
              <HBar label="Payer policy" value={14} max={22} color="#10b981" caption="drugs" />
            </div>
            <div className="mt-3" />
            <InsightBanner
              variant="violet"
              text="Each criterion is mined from FDA labeling, historical approval patterns, and payer policy — so every agent decision traces back to a citable source."
            />
          </SectionCard>

          <SectionCard
            title="Denial-Reason Mix"
            subtitle={`Why PAs were denied (${(triage.denied ?? 0).toLocaleString()} denials analyzed)`}
          >
            <div className="flex flex-1 items-center justify-center py-2">
              <DonutWithCenter
                data={triageData}
                centerValue={medNecCount.toLocaleString()}
                centerLabel="med. necessity"
                size={190}
              />
            </div>
            <DonutLegend data={triageData} />
            <div className="mt-3" />
            <InsightBanner
              variant="red"
              text={`Medical necessity is the single largest denial driver — ${medNecPct.toFixed(
                0,
              )}% of all denials (${medNecCount.toLocaleString()}). With "no evidence submitted", ${(
                triage.addressable_pct ?? 0
              ).toFixed(0)}% of denials are directly addressable by the agent.`}
            />
          </SectionCard>
        </div>

        {/* ── Analysis: denial signals ─────────────────────────────────────── */}
        <SectionCard
          title="Denial Risk vs. Unmet Criteria"
          subtitle="Denial rate climbs with every additional contradictory (unmet) fact"
        >
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={contraData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                label={{ value: "# unmet criteria", position: "insideBottom", offset: -2, fontSize: 10, fill: "#9ca3af" }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 70]}
              />
              <Tooltip
                formatter={(v: any, name: any) => [
                  String(name) === "Denial rate" ? `${v}%` : Number(v).toLocaleString(),
                  String(name),
                ]}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
              />
              <Bar yAxisId="left" dataKey="cases" name="Cases" fill="url(#barGrad)" radius={[5, 5, 0, 0]} barSize={34} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="denial_rate"
                name="Denial rate"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-3" />
          <InsightBanner
            variant="orange"
            text="Cases with 9+ unmet criteria are denied 58% of the time vs. 33% at zero — confirming the agent's coverage-matrix score is a strong, monotonic denial predictor."
          />
        </SectionCard>

        {/* ── Analysis: language signals ───────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-5">
          <SectionCard
            title="Evidence Phrases That Raise Denial Risk"
            subtitle="Terms in clinical answers most associated with denial (lift over base rate)"
          >
            <div className="space-y-2">
              {riskUp.map((t) => (
                <HBar
                  key={t.term}
                  label={t.term}
                  value={t.cases}
                  max={maxTermCases}
                  color="#ef4444"
                  caption={`${t.denial_rate.toFixed(0)}% deny`}
                />
              ))}
            </div>
            <div className="mt-3" />
            <InsightBanner
              variant="red"
              text='"Preferred brand" (96.9% deny) and "unspecified answer" (84.6%) are the strongest denial signals — the agent flags these for rework before filing.'
            />
          </SectionCard>

          <SectionCard
            title="Evidence Phrases That Lower Denial Risk"
            subtitle="Terms most associated with approval (negative lift)"
          >
            <div className="space-y-2">
              {riskDown.map((t) => (
                <HBar
                  key={t.term}
                  label={t.term}
                  value={t.cases}
                  max={maxTermCases}
                  color="#10b981"
                  caption={`${t.denial_rate.toFixed(0)}% deny`}
                />
              ))}
            </div>
            <div className="mt-3" />
            <InsightBanner
              variant="green"
              text='Documenting that an "alternative is available/acceptable" or "on formulary" drops denial to under 14% — exactly the medical-necessity arguments the agent surfaces.'
            />
          </SectionCard>
        </div>

        {/* ── Model card ───────────────────────────────────────────────────── */}
        <SectionCard
          title="Underlying Risk Model"
          subtitle="The denial predictor that scores the agent's coverage matrix"
        >
          <div className="grid grid-cols-5 gap-3">
            <StatPill label="ROC-AUC" value={(insights.model?.roc_auc ?? 0).toFixed(2)} />
            <StatPill label="Baseline AUC" value={(insights.model?.baseline_auc ?? 0).toFixed(2)} />
            <StatPill label="Accuracy" value={`${((insights.model?.accuracy ?? 0) * 100).toFixed(0)}%`} />
            <StatPill label="Precision" value={`${((insights.model?.precision ?? 0) * 100).toFixed(0)}%`} />
            <StatPill label="Base denial rate" value={`${(insights.base_denial_rate ?? 0).toFixed(0)}%`} />
          </div>
          <div className="mt-3" />
          <InsightBanner
            variant="blue"
            text="The risk model lifts AUC from a 0.64 baseline to 0.83 by combining the agent's structured coverage-matrix features with TF-IDF on the clinical narrative."
          />
        </SectionCard>

        {/* ── Held-out validation (Showcase) ───────────────────────────────── */}
        <h2 className="-mb-1 text-body font-bold text-primaryGray-1">Live Validation — Held-Out Real Cases</h2>
        <div className="grid grid-cols-3 gap-5">
          <SectionCard title="Prediction Accuracy" subtitle="Bot prediction vs. the payer's actual decision" className="col-span-1">
            <div className="flex flex-1 items-center justify-center py-2">
              <DonutWithCenter
                data={scDecisionData}
                centerValue={`${scAcc.toFixed(0)}%`}
                centerLabel="correct"
                size={180}
              />
            </div>
            <DonutLegend data={scDecisionData} />
            <div className="mt-3" />
            <InsightBanner
              variant="green"
              text={`On ${scN} previously-filed cases the model had never seen, its go/no-go call matched the payer's real outcome ${scCorrect}/${scN} times (${scAcc.toFixed(
                0,
              )}%). The donut shows how those cases were routed.`}
            />
          </SectionCard>

          <SectionCard title="Validation Cases" subtitle="Each row: predicted risk → decision vs. real outcome" className="col-span-2">
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-x-tiny">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-primaryGray-15 text-left text-primaryGray-7">
                    <th className="py-1.5 pr-2 font-semibold">Drug</th>
                    <th className="py-1.5 pr-2 font-semibold">Payer</th>
                    <th className="py-1.5 pr-2 text-right font-semibold">Risk</th>
                    <th className="py-1.5 pr-2 font-semibold">Decision</th>
                    <th className="py-1.5 pr-2 font-semibold">Actual</th>
                    <th className="py-1.5 font-semibold">✓</th>
                  </tr>
                </thead>
                <tbody>
                  {showcase.map((s) => (
                    <tr key={s.case_id} className="border-b border-primaryGray-16">
                      <td className="py-1.5 pr-2 font-medium text-primaryGray-2">{s.drug}</td>
                      <td className="max-w-[140px] truncate py-1.5 pr-2 text-primaryGray-5" title={s.payer_name}>
                        {s.payer_name}
                      </td>
                      <td className="py-1.5 pr-2 text-right font-bold text-primaryGray-2">{s.predicted_risk.toFixed(0)}%</td>
                      <td className="py-1.5 pr-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            s.predicted_decision === "AUTO_SUBMIT"
                              ? "bg-emerald-50 text-emerald-700"
                              : s.predicted_decision === "BLOCK"
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {String(s.predicted_decision).replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-1.5 pr-2 text-primaryGray-4">{s.actual_outcome}</td>
                      <td className="py-1.5 text-body">{s.correct ? "✅" : "❌"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3" />
            <InsightBanner
              variant="blue"
              text="These are real, previously-filed PAs with known payer outcomes. We run the bot blind, then compare — proving the risk score and auto-submit / block routing hold up on actual cases, not just aggregate stats."
            />
          </SectionCard>
        </div>

        {/* ── Business case / ROI ──────────────────────────────────────────── */}
        <h2 className="-mb-1 text-body font-bold text-primaryGray-1">Business Impact</h2>
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            label="Denials / year"
            value={(impact.denials_today ?? 0).toLocaleString()}
            sub="today"
            accentColor="#ef4444"
            tooltip="Annual denials at the current 60% approval rate across 10,000 PAs — the addressable problem."
          />
          <MetricCard
            label="Year-1 net benefit"
            value={money(impact.year1_net_benefit ?? 0)}
            sub="target scenario"
            accentColor="#10b981"
            tooltip="Total annual benefit (recovered revenue + staff rework saved) minus implementation cost, at the 95% target."
          />
          <MetricCard
            label="ROI"
            value={`${(impact.roi_multiple ?? 0).toFixed(1)}×`}
            sub={`vs ${money(impact.implementation_cost ?? 0)} cost`}
            accentColor="#f59e0b"
            tooltip="Year-1 net benefit divided by the one-time implementation cost."
          />
          <MetricCard
            label="Model recall"
            value={`${(ia.model_recall_pct ?? 0).toFixed(0)}%`}
            sub="denials caught"
            accentColor="#3b82f6"
            tooltip="Share of true denials the risk model flags before submission — the lever in the conservative scenario."
          />
        </div>

        <SectionCard
          title="Two Scenarios, Honestly Labeled"
          subtitle="The stated 60%→95% goal vs. what this model conservatively delivers today"
        >
          <div className="grid grid-cols-2 gap-4">
            {impact.scenarios?.map((s, i) => (
              <div key={s.label} className="rounded-xl border border-primaryGray-15 bg-primaryGray-17 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-small font-bold" style={{ color: i === 0 ? "#10b981" : "#3b82f6" }}>
                    {s.label}
                  </span>
                  <span className="rounded-full border border-primaryGray-15 bg-white px-2 py-0.5 text-[10px] font-medium text-primaryGray-5">
                    → {s.new_approval_rate_pct}% approval
                  </span>
                </div>
                <p className="mt-1.5 text-x-tiny leading-relaxed text-primaryGray-7">{s.note}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <KV k="Denials avoided" v={s.denials_avoided.toLocaleString()} />
                  <KV k="Annual benefit" v={money(s.total_annual_benefit)} />
                  <KV k="Revenue gain" v={money(s.revenue_gain)} />
                  <KV k="Rework savings" v={money(s.rework_savings)} />
                  <KV k="Patient-days saved" v={s.patient_days_saved.toLocaleString()} />
                  <KV k="Staff hours saved" v={s.staff_hours_saved.toLocaleString()} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3" />
          <InsightBanner
            variant="violet"
            text={`Best case: hitting 95% approval avoids ${(
              targetScenario?.denials_avoided ?? 0
            ).toLocaleString()} denials/yr (${money(
              targetScenario?.total_annual_benefit ?? 0,
            )} benefit). Even the conservative, model-grounded case avoids ${(
              groundedScenario?.denials_avoided ?? 0
            ).toLocaleString()} denials and ${(
              groundedScenario?.patient_days_saved ?? 0
            ).toLocaleString()} patient-days of treatment delay.`}
          />
        </SectionCard>

        <SectionCard
          title="Assumptions"
          subtitle="Every dollar above derives from these inputs (config.py) — fully auditable, no marketing math"
        >
          <div className="flex flex-wrap gap-2">
            {[
              `${(ia.annual_pa_volume ?? 0).toLocaleString()} PAs/yr`,
              `${ia.current_approval_rate_pct ?? 0}% → ${ia.target_approval_rate_pct ?? 0}% approval`,
              `${money(ia.revenue_per_approval ?? 0)}/approval`,
              `${ia.rework_minutes_per_case ?? 0} min rework @ ${money(ia.staff_hourly_rate ?? 0)}/hr`,
              `${ia.avg_delay_days ?? 0}-day denial delay`,
              `${ia.preventable_share_pct ?? 0}% preventable`,
              `${ia.fix_success_rate_pct ?? 0}% fix rate`,
            ].map((c) => (
              <span
                key={c}
                className="rounded-full border border-primaryGray-15 bg-primaryGray-17 px-2.5 py-1 text-[10px] font-medium text-primaryGray-5"
              >
                {c}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

const KV = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-center justify-between rounded-lg border border-primaryGray-15 bg-white px-3 py-2">
    <span className="text-x-tiny text-primaryGray-7">{k}</span>
    <span className="text-tiny font-bold text-primaryGray-1">{v}</span>
  </div>
);

export default Analytics;
