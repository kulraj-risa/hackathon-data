import { useMemo } from "react";
import { AgentMeta } from "../../api/denialEngine";

/* ──────────────────────────────────────────────────────────────────────────
 * AgentFlowGraph — an interactive DAG that shows how the agents are wired and
 * which ones run in parallel. Unlike the linear step list, this reflects the
 * real data dependencies in necessity_engine.py / agents.py: DB1·DB2·DB3 fan
 * out, Deciding Factor + Coverage Validator run concurrently, the grey-area
 * Re-Eval branches off, and everything converges on the Final Justification.
 *
 * Nodes light up as the live run advances (driven by activeIdx + phase), and
 * the edges feeding the active node animate so you can watch evidence flow.
 * ────────────────────────────────────────────────────────────────────────── */

type Phase = "idle" | "running" | "done";

interface NodeDef {
  id: string;
  x: number;
  y: number;
  label: string;
  kind: "io" | "agent";
  method?: string;
  optional?: boolean;
}
interface EdgeDef {
  from: string;
  to: string;
}
interface Layout {
  w: number;
  h: number;
  nodes: NodeDef[];
  edges: EdgeDef[];
}

const NODE_W = 150;
const NODE_H = 56;

const SHORT_LABEL: Record<string, string> = {
  db1: "DB1 · Patient Docs",
  db2: "DB2 · Drug Criteria",
  db3: "DB3 · Historical",
  deciding: "Deciding Factor",
  coverage: "Coverage Validator",
  reeval: "Re-Evaluation",
  gap: "Gap Recovery",
  clinical: "Clinical Answering",
  final: "Final Justification",
  criteria_retrieval: "Criteria Retrieval",
  evidence_matching: "Evidence Matching",
  llm_reasoner: "LLM Reasoner",
  mechanism: "Mechanism",
  guidelines: "Guidelines",
  payer_strategy: "Payer Strategy",
  answer_composer: "Answer Composer",
};

// Explicit, hand-tuned layouts so the parallelism reads clearly left→right.
const NECESSITY_LAYOUT: Layout = {
  w: 1180,
  h: 360,
  nodes: [
    { id: "in_docs", x: 8, y: 18, label: "Patient docs", kind: "io" },
    { id: "in_drug", x: 8, y: 150, label: "Drug", kind: "io" },
    { id: "in_payer", x: 8, y: 282, label: "Payer", kind: "io" },
    { id: "db1", x: 210, y: 18, label: "", kind: "agent" },
    { id: "db2", x: 210, y: 150, label: "", kind: "agent" },
    { id: "db3", x: 210, y: 282, label: "", kind: "agent" },
    { id: "deciding", x: 420, y: 84, label: "", kind: "agent" },
    { id: "coverage", x: 420, y: 216, label: "", kind: "agent" },
    { id: "reeval", x: 632, y: 16, label: "", kind: "agent", optional: true },
    { id: "gap", x: 632, y: 138, label: "", kind: "agent" },
    { id: "clinical", x: 632, y: 260, label: "", kind: "agent" },
    { id: "final", x: 850, y: 138, label: "", kind: "agent" },
    { id: "decision", x: 1024, y: 138, label: "Decision", kind: "io" },
  ],
  edges: [
    { from: "in_docs", to: "db1" },
    { from: "in_drug", to: "db1" },
    { from: "in_drug", to: "db2" },
    { from: "in_drug", to: "db3" },
    { from: "in_payer", to: "db2" },
    { from: "in_payer", to: "db3" },
    { from: "db1", to: "deciding" },
    { from: "db1", to: "coverage" },
    { from: "db2", to: "deciding" },
    { from: "db2", to: "coverage" },
    { from: "db3", to: "deciding" },
    { from: "deciding", to: "reeval" },
    { from: "deciding", to: "clinical" },
    { from: "deciding", to: "final" },
    { from: "coverage", to: "clinical" },
    { from: "coverage", to: "gap" },
    { from: "deciding", to: "gap" },
    { from: "gap", to: "final" },
    { from: "reeval", to: "final" },
    { from: "clinical", to: "final" },
    { from: "final", to: "decision" },
  ],
};

const ANSWER_LAYOUT: Layout = {
  w: 1180,
  h: 380,
  nodes: [
    { id: "in_drug", x: 8, y: 28, label: "Drug", kind: "io" },
    { id: "in_evidence", x: 8, y: 178, label: "Chart evidence", kind: "io" },
    { id: "in_payer", x: 8, y: 312, label: "Payer", kind: "io" },
    { id: "criteria_retrieval", x: 205, y: 28, label: "", kind: "agent" },
    { id: "mechanism", x: 205, y: 150, label: "", kind: "agent" },
    { id: "guidelines", x: 205, y: 240, label: "", kind: "agent" },
    { id: "evidence_matching", x: 410, y: 28, label: "", kind: "agent" },
    { id: "payer_strategy", x: 410, y: 312, label: "", kind: "agent" },
    { id: "llm_reasoner", x: 620, y: 120, label: "", kind: "agent", optional: true },
    { id: "answer_composer", x: 838, y: 170, label: "", kind: "agent" },
    { id: "verdict", x: 1022, y: 170, label: "Verdict", kind: "io" },
  ],
  edges: [
    { from: "in_drug", to: "criteria_retrieval" },
    { from: "in_drug", to: "mechanism" },
    { from: "in_drug", to: "guidelines" },
    { from: "in_payer", to: "payer_strategy" },
    { from: "criteria_retrieval", to: "evidence_matching" },
    { from: "criteria_retrieval", to: "payer_strategy" },
    { from: "in_evidence", to: "evidence_matching" },
    { from: "evidence_matching", to: "llm_reasoner" },
    { from: "mechanism", to: "llm_reasoner" },
    { from: "guidelines", to: "llm_reasoner" },
    { from: "payer_strategy", to: "llm_reasoner" },
    { from: "evidence_matching", to: "answer_composer" },
    { from: "mechanism", to: "answer_composer" },
    { from: "guidelines", to: "answer_composer" },
    { from: "payer_strategy", to: "answer_composer" },
    { from: "llm_reasoner", to: "answer_composer" },
    { from: "answer_composer", to: "verdict" },
  ],
};

// Wrap a label into at most two lines (prefer the " · " separator).
const wrapLabel = (label: string): string[] => {
  if (label.includes(" · ")) return label.split(" · ");
  if (label.length <= 16) return [label];
  const words = label.split(" ");
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
};

interface Props {
  mode: "necessity" | "answer";
  steps: AgentMeta[];
  activeIdx: number;
  phase: Phase;
  llmAvailable: boolean;
  methodStyle: (m: string) => { bg: string; color: string };
}

const AgentFlowGraph = ({
  mode,
  steps,
  activeIdx,
  phase,
  llmAvailable,
  methodStyle,
}: Props) => {
  const layout = mode === "necessity" ? NECESSITY_LAYOUT : ANSWER_LAYOUT;

  // Map step id -> its position in the animated run order.
  const orderOf = useMemo(() => {
    const m: Record<string, number> = {};
    steps.forEach((s, i) => (m[s.id] = i));
    return m;
  }, [steps]);

  const methodOf = useMemo(() => {
    const m: Record<string, string> = {};
    steps.forEach((s) => (m[s.id] = s.method));
    return m;
  }, [steps]);

  const nodeById = useMemo(() => {
    const m: Record<string, NodeDef> = {};
    layout.nodes.forEach((n) => (m[n.id] = n));
    return m;
  }, [layout]);

  const stateOf = (id: string): "idle" | "active" | "done" => {
    const idx = orderOf[id];
    if (idx === undefined) {
      // io nodes: inputs are "done" once running starts; decision after done.
      if (id === "decision" || id === "verdict")
        return phase === "done" ? "done" : "idle";
      return phase === "idle" ? "idle" : "done";
    }
    if (phase === "done") return "done";
    if (phase === "running") {
      if (idx === activeIdx) return "active";
      if (idx < activeIdx) return "done";
    }
    return "idle";
  };

  const edgePath = (from: NodeDef, to: NodeDef): string => {
    const x1 = from.x + NODE_W;
    const y1 = from.y + NODE_H / 2;
    const x2 = to.x;
    const y2 = to.y + NODE_H / 2;
    const dx = Math.max(40, (x2 - x1) / 2);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  // An edge is "live" when it feeds the currently-active node.
  const isLiveEdge = (toId: string) =>
    phase === "running" && stateOf(toId) === "active";

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${layout.w} ${layout.h}`}
        style={{ minWidth: 760, width: "100%", height: "auto" }}
        role="img"
        aria-label="Agent orchestration flow graph"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#CBD2DC" />
          </marker>
          <marker
            id="arrow-live"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#5B21B6" />
          </marker>
        </defs>

        {/* edges */}
        {layout.edges.map((e, i) => {
          const from = nodeById[e.from];
          const to = nodeById[e.to];
          if (!from || !to) return null;
          const live = isLiveEdge(e.to);
          const bothDone =
            stateOf(e.from) === "done" && stateOf(e.to) === "done";
          return (
            <path
              key={i}
              d={edgePath(from, to)}
              fill="none"
              stroke={live ? "#5B21B6" : bothDone ? "#9FB0C3" : "#E0E5EC"}
              strokeWidth={live ? 2.4 : 1.6}
              markerEnd={live ? "url(#arrow-live)" : "url(#arrow)"}
              strokeDasharray={live ? "6 5" : undefined}
            >
              {live && (
                <animate
                  attributeName="stroke-dashoffset"
                  from="22"
                  to="0"
                  dur="0.7s"
                  repeatCount="indefinite"
                />
              )}
            </path>
          );
        })}

        {/* nodes */}
        {layout.nodes.map((n) => {
          const st = stateOf(n.id);
          const isIo = n.kind === "io";
          const method = methodOf[n.id];
          const ms = method ? methodStyle(method) : { bg: "#EEF1F5", color: "#475569" };
          const label = n.label || SHORT_LABEL[n.id] || n.id;
          const lines = wrapLabel(label);
          const dimmed = n.optional && !llmAvailable;

          const border =
            st === "active" ? ms.color : st === "done" ? "#9FB0C3" : "#E0E5EC";
          const fill = isIo ? "#F8FAFC" : "#FFFFFF";
          const opacity = dimmed ? 0.45 : st === "idle" && phase !== "idle" ? 0.7 : 1;

          return (
            <g key={n.id} opacity={opacity}>
              <rect
                x={n.x}
                y={n.y}
                width={NODE_W}
                height={NODE_H}
                rx={isIo ? 10 : 8}
                fill={fill}
                stroke={border}
                strokeWidth={st === "active" ? 2.5 : 1.4}
                strokeDasharray={isIo ? "5 4" : undefined}
                style={
                  st === "active"
                    ? { filter: `drop-shadow(0 0 6px ${ms.color}55)` }
                    : undefined
                }
              />
              {/* method accent bar (agents only) */}
              {!isIo && (
                <rect
                  x={n.x}
                  y={n.y}
                  width={5}
                  height={NODE_H}
                  rx={2}
                  fill={ms.color}
                />
              )}
              {/* status pip */}
              {!isIo && (
                <g>
                  <circle
                    cx={n.x + NODE_W - 14}
                    cy={n.y + 14}
                    r={8}
                    fill={
                      st === "done"
                        ? "#005D49"
                        : st === "active"
                          ? ms.color
                          : "#E5E9EF"
                    }
                  />
                  <text
                    x={n.x + NODE_W - 14}
                    y={n.y + 14}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    fontWeight="700"
                    fill={st === "idle" ? "#94A3B8" : "#FFFFFF"}
                  >
                    {st === "done" ? "✓" : (orderOf[n.id] ?? 0) + 1}
                  </text>
                </g>
              )}
              {/* label */}
              {lines.map((ln, li) => (
                <text
                  key={li}
                  x={n.x + (isIo ? NODE_W / 2 : 14)}
                  y={n.y + NODE_H / 2 + (li - (lines.length - 1) / 2) * 13}
                  textAnchor={isIo ? "middle" : "start"}
                  dominantBaseline="central"
                  fontSize="11.5"
                  fontWeight="600"
                  fill={isIo ? "#475569" : "#1F2937"}
                >
                  {ln}
                </text>
              ))}
              {/* optional tag */}
              {n.optional && (
                <text
                  x={n.x + 14}
                  y={n.y + NODE_H - 8}
                  fontSize="8.5"
                  fontWeight="700"
                  fill="#94A3B8"
                  style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
                >
                  optional · LLM
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-primaryGray-6">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "#005D49" }}
          />
          completed
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "#5B21B6" }}
          />
          reasoning now
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm border border-dashed border-primaryGray-9" />
          input / output
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-5 border-t-2 border-dashed border-[#5B21B6]" />
          live data flow
        </span>
        <span className="ml-auto italic">
          Nodes in the same column run in parallel.
        </span>
      </div>
    </div>
  );
};

export default AgentFlowGraph;
