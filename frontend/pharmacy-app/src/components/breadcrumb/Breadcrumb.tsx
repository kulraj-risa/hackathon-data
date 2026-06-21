import React from "react";
import { useNavigate } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  path?: string;
  isCurrent?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const ChevronIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0 text-primaryGray-9"
  >
    <path
      d="M9 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center gap-1.5 pl-2 pt-1 text-h12">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronIcon />}
          {item.isCurrent ? (
            <span
              className="rounded px-2.5 py-0.5 text-h12 font-semibold"
              style={{ backgroundColor: "#EBF2FF", color: "#2563EB" }}
            >
              {item.label}
            </span>
          ) : (
            <span
              className="cursor-pointer text-h12 font-medium text-primaryGray-9 transition-colors hover:text-tertiaryBlue-4"
              onClick={() => item.path && navigate(item.path)}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;

/**
 * Helper to build the standard breadcrumb items for a given active step.
 *
 * Steps:  Worklist → EV-BV → PA Form → Medical Necessity → Outcome
 */
export function buildBreadcrumbItems(
  activeStep: "ev-bv" | "pa-form" | "medical-necessity" | "outcome",
  recordId: string,
): BreadcrumbItem[] {
  const steps: {
    key: string;
    label: string;
    pathFn: (id: string) => string;
  }[] = [
    {
      key: "worklist",
      label: "Worklist",
      pathFn: () => "/pharma-pa-worklists/pharma-pa-orders",
    },
    {
      key: "ev-bv",
      label: "EV-BV",
      pathFn: (id) => `/pharma-pa-worklists/insurance-details/${id}`,
    },
    {
      key: "pa-form",
      label: "PA Form",
      pathFn: (id) => `/pharma-pa-worklists/pharma-pa-form/${id}`,
    },
    {
      key: "medical-necessity",
      label: "Medical Necessity",
      pathFn: (id) => `/pharma-pa-worklists/pharma-pa-questionaire/${id}`,
    },
    {
      key: "outcome",
      label: "Outcome",
      pathFn: (id) => `/pharma-pa-worklists/pharma-pa-outcome/${id}`,
    },
  ];

  const activeIndex = steps.findIndex((s) => s.key === activeStep);
  return steps.map((step, idx) => ({
    label: step.label,
    path: idx !== activeIndex ? step.pathFn(recordId) : undefined,
    isCurrent: idx === activeIndex,
  }));
}
