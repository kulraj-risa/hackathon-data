import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ──────────────────────────────────────────────────────────────────────────
 * WorkflowDiagram — the end-to-end PA lifecycle map (the "spine" of the demo).
 *
 * Mirrors the reference workflow: intake → ingestion → worklist → document
 * retrieval → the 3-DB brain → deciding-factor + coverage → approval
 * optimization / gap recovery / clinical answering → final recommendation
 * (AUTO_SUBMIT | REVIEW | BLOCK) → send to plan → track status → approved /
 * denied (appeal) → continuous learning loop.
 *
 * Every stage maps to a real feature in the app. The walkthrough lights stages
 * up in sequence; clicking a stage focuses it and (where it has a live feature)
 * links straight to that screen.
 * ────────────────────────────────────────────────────────────────────────── */

type GroupKey =
  | "intake"
  | "worklist"
  | "retrieval"
  | "brain"
  | "decision"
  | "optimize"
  | "final"
  | "send"
  | "track"
  | "approved"
  | "denied"
  | "learning";

interface Palette {
  bg: string;
  border: string;
  dot: string;
  text: string;
}

const PALETTE: Record<GroupKey, Palette> = {
  intake: { bg: "#f1f5f9", border: "#cbd5e1", dot: "#64748b", text: "#475569" },
  worklist: { bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6", text: "#1d4ed8" },
  retrieval: { bg: "#eef2ff", border: "#c7d2fe", dot: "#6366f1", text: "#4338ca" },
  brain: { bg: "#f5f3ff", border: "#ddd6fe", dot: "#8b5cf6", text: "#6d28d9" },
  decision: { bg: "#f0fdfa", border: "#99f6e4", dot: "#14b8a6", text: "#0f766e" },
  optimize: { bg: "#fff7ed", border: "#fed7aa", dot: "#f59e0b", text: "#c2410c" },
  final: { bg: "#ecfdf5", border: "#a7f3d0", dot: "#10b981", text: "#047857" },
  send: { bg: "#eff6ff", border: "#bfdbfe", dot: "#2563eb", text: "#1d4ed8" },
  track: { bg: "#f8fafc", border: "#e2e8f0", dot: "#64748b", text: "#475569" },
  approved: { bg: "#ecfdf5", border: "#a7f3d0", dot: "#10b981", text: "#047857" },
  denied: { bg: "#fef2f2", border: "#fecaca", dot: "#ef4444", text: "#b91c1c" },
  learning: { bg: "#fffbeb", border: "#fde68a", dot: "#d97706", text: "#b45309" },
};

interface StageDef {
  id: string;
  title: string;
  group: GroupKey;
  blurb: string;
  items: string[];
  /** Real feature this stage maps to + a route to open it. */
  feature?: string;
  link?: string;
}

// Rows of the flow. Each inner array renders side-by-side (parallel) nodes.
const ROWS: StageDef[][] = [
  [
    {
      id: "ingestion",
      title: "Case Ingestion Engine",
      group: "intake",
      blurb: "PA cases arrive from many channels and are normalized into one queue.",
      items: ["Parse files (SFTP · Email · SendIt · OncoEMR · CSV)", "Create PA cases", "Assign Case IDs", "Validate data"],
      feature: "Worklist · PA Orders",
      link: "/pharma-pa-worklists/pharma-pa-orders",
    },
  ],
  [
    {
      id: "worklist",
      title: "Worklist",
      group: "worklist",
      blurb: "Every case lands in a queue and is triaged by readiness.",
      items: ["Active PA Queue", "Review Queue", "Missing Docs Queue"],
      feature: "Worklist tab (live)",
      link: "/pharma-pa-worklists/pharma-pa-orders",
    },
  ],
  [
    {
      id: "retrieval",
      title: "Document Retrieval & Form Intelligence",
      group: "retrieval",
      blurb: "Pulls every piece of evidence the payer form needs.",
      items: [
        "Insurance · Provider · Patient demographics",
        "Drug info · ICD codes · Labs",
        "Progress notes · Prior treatment history",
        "Supporting documents · Payer form · CoverMyMeds key",
      ],
    },
  ],
  [
    {
      id: "db1",
      title: "DB1 · Evidence Extraction",
      group: "brain",
      blurb: "Structures the patient's chart into discrete, citable facts.",
      items: ["Extract clinical evidence", "Supportive vs. contradictory facts"],
      feature: "Agent Studio · flow graph",
      link: "/pharma-agent-studio",
    },
    {
      id: "db2",
      title: "DB2 · Criteria Intelligence",
      group: "brain",
      blurb: "The coverage rules each PA must satisfy.",
      items: ["FDA label criteria", "Payer medical policy", "Critical vs. soft criteria"],
      feature: "Agent Studio · Criteria KB",
      link: "/pharma-agent-studio",
    },
    {
      id: "db3",
      title: "DB3 · Historical Intelligence",
      group: "brain",
      blurb: "What actually won approval on past, similar cases.",
      items: ["Historical approval patterns", "Per-drug / per-payer base rates"],
      feature: "Agent Studio · flow graph",
      link: "/pharma-agent-studio",
    },
  ],
  [
    {
      id: "deciding",
      title: "Deciding Factor Engine",
      group: "decision",
      blurb: "Fuses the three databases into four weighted scores.",
      items: ["Clinical score", "Coverage score", "Historical score", "Documentation score"],
      feature: "Medical Necessity engine",
      link: "/pharma-pa-simulator",
    },
    {
      id: "coverage",
      title: "Coverage Matrix",
      group: "decision",
      blurb: "Maps every criterion to the evidence that satisfies it.",
      items: ["Criteria ↔ evidence mapping", "Met / missing requirements", "Confidence scores"],
      feature: "Necessity coverage matrix",
      link: "/pharma-pa-simulator",
    },
  ],
  [
    {
      id: "optimize",
      title: "Approval Optimization",
      group: "optimize",
      blurb: "Re-reads borderline cases to find an approvable path.",
      items: ["Alternative pathways", "Evidence re-evaluation"],
    },
    {
      id: "gap",
      title: "Gap Recovery Engine",
      group: "optimize",
      blurb: "For unmet criteria, finds the way to recover or appeal.",
      items: ["Missing-criteria analysis", "Recovery opportunities", "Appeal strategies"],
      feature: "Gap Recovery (live)",
      link: "/pharma-pa-simulator",
    },
    {
      id: "clinical",
      title: "Clinical Answering Engine",
      group: "optimize",
      blurb: "Drafts every questionnaire answer with a citation.",
      items: ["Questionnaire responses", "Justifications", "Supporting evidence"],
      feature: "Answer engine (live)",
      link: "/pharma-pa-simulator",
    },
  ],
  [
    {
      id: "final",
      title: "Final Recommendation",
      group: "final",
      blurb: "One go / no-go call, with the reasons behind it.",
      items: ["Approval probability", "Denial probability", "Missing documents & criteria", "→ AUTO SUBMIT · REVIEW · BLOCK"],
      feature: "Touchless panel (live)",
      link: "/pharma-pa-worklists/pharma-pa-orders",
    },
  ],
  [
    {
      id: "send",
      title: "Send to Plan",
      group: "send",
      blurb: "Auto-submitted cases file themselves, end to end.",
      items: ["Dashboard → CoverMyMeds → Payer"],
    },
  ],
  [
    {
      id: "track",
      title: "Track Status",
      group: "track",
      blurb: "Watches the payer response and captures the outcome.",
      items: ["Approval / denial status", "Additional-info requests", "Letters · screenshots"],
    },
  ],
  [
    {
      id: "approved",
      title: "Approved Path",
      group: "approved",
      blurb: "Capture the win and close the loop in the EHR.",
      items: ["Approval letter", "Upload outcome", "Update EHR · close case"],
    },
    {
      id: "appeal",
      title: "Denied Path · Appeal Engine",
      group: "denied",
      blurb: "Denials become appeals — automatically.",
      items: ["Root cause · recovery score", "Appeal letter & submission", "Appeal outcome → update EHR · close"],
      feature: "Post-Denial Recovery (live)",
      link: "/pharma-pa-simulator",
    },
  ],
  [
    {
      id: "learning",
      title: "Continuous Learning Loop",
      group: "learning",
      blurb: "Every real outcome retrains the model — better predictions over time.",
      items: ["Final outcomes", "Ground-truth validation", "Model insights", "→ Improved prediction + better approval rates"],
      feature: "Analytics · closed-loop eval",
      link: "/pharma-analytics",
    },
  ],
];

const INTAKE_SOURCES = ["SFTP", "Email", "SendIt", "OncoEMR", "CSV"];

// Flatten to an ordered sequence for the animated walkthrough.
const SEQUENCE: string[] = ROWS.flat().map((s) => s.id);

const StageCard = ({
  stage,
  state,
  onClick,
}: {
  stage: StageDef;
  state: "idle" | "active" | "done";
  onClick: () => void;
}) => {
  const p = PALETTE[stage.group];
  const active = state === "active";
  const done = state === "done";
  return (
    <button
      onClick={onClick}
      className="group relative flex w-full flex-col rounded-xl border bg-white px-3.5 py-3 text-left transition-all"
      style={{
        borderColor: active ? p.dot : p.border,
        boxShadow: active ? `0 0 0 3px ${p.dot}33, 0 6px 16px ${p.dot}22` : undefined,
        background: active ? p.bg : "#fff",
        opacity: state === "idle" ? 0.82 : 1,
      }}
    >
      <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ backgroundColor: p.dot }} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-small font-bold" style={{ color: p.text }}>
          {stage.title}
        </span>
        <span
          className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
          style={{ backgroundColor: done ? "#005D49" : active ? p.dot : "#cbd5e1" }}
        >
          {done ? "✓" : SEQUENCE.indexOf(stage.id) + 1}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] leading-snug text-primaryGray-7">{stage.blurb}</p>
      <ul className="mt-2 space-y-1">
        {stage.items.map((it) => (
          <li key={it} className="flex items-start gap-1.5 text-[11px] leading-snug text-primaryGray-4">
            <span className="mt-1 inline-block h-1 w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: p.dot }} />
            {it}
          </li>
        ))}
      </ul>
      {stage.feature && (
        <span
          className="mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: p.bg, color: p.text, border: `1px solid ${p.border}` }}
        >
          {stage.link ? "↗ " : ""}
          {stage.feature}
        </span>
      )}
    </button>
  );
};

const Connector = ({ label }: { label?: string }) => (
  <div className="flex flex-col items-center py-1.5">
    <svg width="16" height="20" viewBox="0 0 16 20" aria-hidden>
      <line x1="8" y1="0" x2="8" y2="13" stroke="#cbd5e1" strokeWidth="1.6" />
      <path d="M3 11 L8 17 L13 11" fill="none" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    {label && <span className="-mt-1 text-[9px] font-semibold uppercase tracking-wide text-primaryGray-9">{label}</span>}
  </div>
);

const WorkflowDiagram = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(-1); // -1 = nothing highlighted
  const [playing, setPlaying] = useState(false);
  const [focusId, setFocusId] = useState<string>("ingestion");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    timer.current = setInterval(() => {
      setStep((s) => {
        const next = s + 1;
        if (next >= SEQUENCE.length) {
          setPlaying(false);
          return SEQUENCE.length - 1;
        }
        setFocusId(SEQUENCE[next]);
        return next;
      });
    }, 1100);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing]);

  const stateOf = (id: string): "idle" | "active" | "done" => {
    const idx = SEQUENCE.indexOf(id);
    if (step < 0) return "idle";
    if (idx === step) return "active";
    if (idx < step) return "done";
    return "idle";
  };

  const focus = useMemo(() => ROWS.flat().find((s) => s.id === focusId) || ROWS.flat()[0], [focusId]);
  const fp = PALETTE[focus.group];

  const play = () => {
    if (step >= SEQUENCE.length - 1) setStep(-1);
    setPlaying(true);
  };
  const reset = () => {
    setPlaying(false);
    setStep(-1);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-h11 font-bold text-primaryGray-1">End-to-End PA Workflow</div>
          <div className="mt-0.5 max-w-[680px] text-tiny text-primaryGray-7">
            How a prior auth flows from intake to outcome — and how every real outcome retrains the model. Each stage is a
            live feature; play the walkthrough or click any stage to open it.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-primaryGray-14 bg-white px-3 py-2 text-x-tiny font-semibold text-primaryGray-6">
            Stage {Math.max(0, step + 1)} / {SEQUENCE.length}
          </span>
          <button
            onClick={() => (playing ? setPlaying(false) : play())}
            className="rounded-lg bg-[#005D49] px-3.5 py-2 text-small font-bold text-white hover:opacity-90"
          >
            {playing ? "❚❚ Pause" : "▶ Play walkthrough"}
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-primaryGray-14 bg-white px-3.5 py-2 text-small font-bold text-primaryGray-3 hover:bg-primaryGray-16"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-[1fr_320px] gap-4 overflow-hidden">
        {/* Flow */}
        <div className="overflow-y-auto rounded-xl border border-primaryGray-15 bg-primaryGray-17 p-4">
          {/* Intake sources */}
          <div className="mb-1 flex flex-wrap items-center justify-center gap-2">
            {INTAKE_SOURCES.map((s) => (
              <span
                key={s}
                className="rounded-full border border-primaryGray-14 bg-white px-3 py-1 text-x-tiny font-semibold text-primaryGray-5"
              >
                {s}
              </span>
            ))}
          </div>
          <Connector label="ingest" />

          {ROWS.map((row, ri) => (
            <div key={ri}>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
              >
                {row.map((stage) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    state={stateOf(stage.id)}
                    onClick={() => {
                      setFocusId(stage.id);
                      setStep(SEQUENCE.indexOf(stage.id));
                      setPlaying(false);
                    }}
                  />
                ))}
              </div>
              {ri < ROWS.length - 1 && (
                <Connector
                  label={
                    ri === 2 ? "3-database brain" : ri === 5 ? "decision" : ri === 9 ? "outcome" : undefined
                  }
                />
              )}
            </div>
          ))}

          {/* Learning loop arrow back to top */}
          <div className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#fde68a] bg-[#fffbeb] px-3 py-1.5 text-[10px] font-semibold text-[#b45309]">
            ↻ Outcomes feed back into DB3 (Historical Intelligence) — the loop closes
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex flex-col overflow-y-auto rounded-xl border border-primaryGray-15 bg-white p-4">
          <span
            className="mb-2 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: fp.bg, color: fp.text, border: `1px solid ${fp.border}` }}
          >
            Stage {SEQUENCE.indexOf(focus.id) + 1} of {SEQUENCE.length}
          </span>
          <h3 className="text-body font-extrabold text-primaryGray-1">{focus.title}</h3>
          <p className="mt-1 text-tiny leading-relaxed text-primaryGray-7">{focus.blurb}</p>

          <div className="mt-3 text-x-tiny font-semibold uppercase tracking-wide text-primaryGray-8">What happens here</div>
          <ul className="mt-1.5 space-y-1.5">
            {focus.items.map((it) => (
              <li key={it} className="flex items-start gap-2 text-tiny text-primaryGray-3">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: fp.dot }} />
                {it}
              </li>
            ))}
          </ul>

          {focus.feature && (
            <div className="mt-auto pt-4">
              <div className="text-x-tiny font-semibold uppercase tracking-wide text-primaryGray-8">Live in this app</div>
              <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg border border-primaryGray-15 bg-primaryGray-17 px-3 py-2">
                <span className="text-tiny font-semibold text-primaryGray-2">{focus.feature}</span>
                {focus.link && (
                  <button
                    onClick={() => navigate(focus.link!)}
                    className="rounded-md bg-[#005D49] px-2.5 py-1 text-x-tiny font-bold text-white hover:opacity-90"
                  >
                    Open →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowDiagram;
