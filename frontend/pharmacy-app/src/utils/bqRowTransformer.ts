import { TableCellType, TableHeader } from "../components/custom-table/table";
import { FieldMapping } from "../pages/configurations/pages/fieldMapping/defaultMapping";

/** Known credential / suffix abbreviations that should stay UPPERCASE */
const CREDENTIAL_ABBREVS = new Set([
  "MD",
  "DO",
  "PA",
  "NP",
  "NP-C",
  "NP-BC",
  "RN",
  "RN-BC",
  "LPN",
  "DPM",
  "DDS",
  "DMD",
  "OD",
  "DC",
  "DPT",
  "PharmD",
  "PHARMD",
  "APRN",
  "CRNA",
  "CNS",
  "CNM",
  "DNP",
  "FNP",
  "FNP-C",
  "FNP-BC",
  "PA-C",
  "MPAS",
  "MMS",
  "PhD",
  "PHD",
  "MS",
  "MA",
  "MBA",
  "MPH",
  "MSN",
  "BSN",
  "FACP",
  "FACS",
  "FACOG",
  "FAAN",
  "FAAP",
  "II",
  "III",
  "IV",
  "JR",
  "SR",
]);

/** Title-case a name string, preserving credential abbreviations (MD, PA, NP, DO …) */
function titleCase(str: any): string {
  if (!str) return "";
  const s = String(str);
  // Split on whitespace while keeping delimiters
  return s
    .split(/(\s+|,\s*)/)
    .map((token) => {
      const stripped = token.replace(/[.,]/g, "").toUpperCase();
      if (CREDENTIAL_ABBREVS.has(stripped)) return token.toUpperCase();
      if (/^\s+$/.test(token) || /^,\s*$/.test(token)) return token;
      return token.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    })
    .join("");
}

const NAME_PATHS = new Set([
  "patient.full_name",
  "patient.first_name",
  "patient.last_name",
  "provider.full_name",
  "provider.first_name",
  "provider.last_name",
  "drug.drug_name",
  "drug.drug_name_onco_emr",
]);

export function getNestedValue(obj: Record<string, any>, path: string): any {
  // Computed: patient.age from patient.dob
  if (path === "patient.age") {
    const dob = obj?.patient?.dob ?? obj?.dob;
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }
  const raw = path
    .split(".")
    .reduce((curr: any, key: string) => curr?.[key], obj);
  // Apply title case to name fields
  if (NAME_PATHS.has(path) && raw) return titleCase(raw);
  return raw;
}

function resolveFieldValue(
  row: Record<string, any>,
  mapping: FieldMapping,
  which: "main" | "secondary",
): string {
  if (which === "main") {
    if (mapping.concatFields && mapping.concatFields.length > 0) {
      const parts = mapping.concatFields
        .map((p) => getNestedValue(row, p))
        .filter(Boolean);
      const raw = parts.join(" ");
      return (mapping.prefix ?? "") + raw + (mapping.suffix ?? "");
    }
    const val = getNestedValue(row, mapping.mainField);
    return (mapping.prefix ?? "") + (val ?? "--") + (mapping.suffix ?? "");
  }

  if (!mapping.secondaryField) return "";
  if (
    mapping.secondaryConcatFields &&
    mapping.secondaryConcatFields.length > 0
  ) {
    const parts = mapping.secondaryConcatFields
      .map((p) => getNestedValue(row, p))
      .filter(Boolean);
    const raw = parts.join(" ");
    return (
      (mapping.secondaryPrefix ?? "") + raw + (mapping.secondarySuffix ?? "")
    );
  }
  const val = getNestedValue(row, mapping.secondaryField);
  return (
    (mapping.secondaryPrefix ?? "") +
    (val ?? "--") +
    (mapping.secondarySuffix ?? "")
  );
}

function buildBadgeValue(text: string): Record<string, any> {
  const lower = (text ?? "").toString().toLowerCase().replace(/\s+/g, "_");
  let color = "#0F0F0F";
  let bgColor = "#F5F5F5";

  if (
    lower.includes("approved") ||
    lower.includes("auth_on_file") ||
    lower.includes("verified") ||
    lower.includes("success") ||
    lower.includes("no_auth_required") ||
    lower.includes("auth_not_required") ||
    lower.includes("request_response") ||
    lower.includes("approval_on_file") ||
    lower.includes("case_outcome") ||
    lower.includes("form_outcome")
  ) {
    color = "#005D49";
    bgColor = "#E6F3F0";
  } else if (
    lower.includes("denied") ||
    lower.includes("denial_on_file") ||
    lower.includes("drug_not_covered") ||
    lower.includes("error") ||
    lower.includes("inaccuracy")
  ) {
    color = "#CC0300";
    bgColor = "#FFE8E8";
  } else if (
    lower.includes("pending") ||
    lower.includes("sent_to_plan") ||
    lower.includes("waiting") ||
    lower.includes("auth_needed")
  ) {
    color = "#C24400";
    bgColor = "#FFF3E0";
  } else if (
    lower.includes("in_progress") ||
    lower.includes("inprogress") ||
    lower.includes("form_filled") ||
    lower.includes("first_stp")
  ) {
    color = "#C24400";
    bgColor = "#FFF3E0";
  } else if (
    lower.includes("new") ||
    lower.includes("submitted") ||
    lower.includes("qa_fetched")
  ) {
    color = "#0056D6";
    bgColor = "#EAF2FF";
  }

  return { text: text || "No Status", color, bgColor };
}

/**
 * Computed "1st STP (Touchless)" badge — derived from real workflow fields.
 *
 * The first STP is automatic: once demographics/form are filled the engine
 * either auto-sends to plan (TOUCHLESS) or a human must step in. Once QA is
 * fetched (clinicals answered) the STP is already behind us.
 */
function buildTouchlessStpBadge(row: Record<string, any>): Record<string, any> {
  const status = String(getNestedValue(row, "workflow.status") ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_");
  const filledBy = String(
    getNestedValue(row, "qa_filled_by") ??
      getNestedValue(row, "workflow.qa_filled_by") ??
      "",
  ).toLowerCase();
  const humanAgent = getNestedValue(row, "record_closed_by.human_agent");
  const assignee = getNestedValue(row, "workflow.assignee_id");
  const filledByHuman =
    !!filledBy && !/ai|system|risa|auto|bot|touchless|engine/.test(filledBy);
  const isHuman = !!humanAgent || !!assignee || filledByHuman;

  const hasQA = /qa_fetched|qa_incomplete|qa_not_found|clinical/.test(status);
  const sentToPlan =
    /sent_to_plan|send_to_plan/.test(status) && !/error/.test(status);
  const formFilled = /form_filled|first_stp|demographic/.test(status);

  const green = { color: "#005D49", bgColor: "#E6F3F0" };
  const amber = { color: "#C24400", bgColor: "#FFF3E0" };
  const muted = { color: "#0F0F0F", bgColor: "#F5F5F5" };

  if (sentToPlan || hasQA || /first_stp_outcome/.test(status)) {
    return isHuman
      ? { text: "Human STP", ...amber }
      : { text: "Touchless", ...green };
  }
  if (formFilled) return { text: "Pending STP", ...amber };
  return { text: status ? "In progress" : "—", ...muted };
}

function buildMissingDataBadge(val: any, count?: any): Record<string, any> {
  const isMissing = val === true || val === "true";
  const countNum = count != null && count !== "" ? Number(count) : 0;
  return {
    text: isMissing ? (countNum > 0 ? `Yes (${countNum})` : "Yes") : "No",
    color: isMissing ? "#CC0300" : "#005D49",
    bgColor: isMissing ? "#FFE8E8" : "#E6F3F0",
  };
}

export function transformBqRowsToTableData(
  rows: Record<string, any>[],
  mapping: FieldMapping[],
  headers: TableHeader[],
): Record<string, any>[] {
  const mappingByKey = new Map(mapping.map((m) => [m.columnKey, m]));

  return rows.map((row) => {
    const record: Record<string, any> = {};
    const rowId = row.identifier ?? row.case_id ?? "";

    for (const header of headers) {
      // Computed column — derived from the row, not the field mapping, so it
      // always renders regardless of the saved column/field configuration.
      if (header.key === "stpTouchless") {
        record[header.key] = buildTouchlessStpBadge(row);
        continue;
      }

      const m = mappingByKey.get(header.key);
      if (!m) {
        record[header.key] = "--";
        continue;
      }

      if (!m.mappable) {
        if (header.type === TableCellType.EXPANDABLE_ROW_ICON) {
          record[header.key] = {
            borderColor: "transparent",
            borderWidth: 0,
            id: rowId,
            isExpanded: false,
          };
        } else if (header.type === TableCellType.BUTTON_WITH_THREE_DOTS) {
          record[header.key] = {
            label: "View",
            buttonId: "view",
            disabled: false,
            rowId,
            showEyeIcon: true,
            eyeIconId: "workflow_timeline",
            threeDotsOptions: [
              { id: "edit_record", text: "Edit Record" },
              { id: "rerun_from_onco_emr", text: "Rerun from Onco Emr" },
              { id: "rerun_from_cmm", text: "Rerun from CMM" },
              {
                id: "report_prescription_inaccuracy",
                text: "Report Prescription Inaccuracy",
              },
              {
                id: "report_medication_inaccuracy",
                text: "Report Medication Inaccuracy",
              },
              { id: "report_inaccuracy", text: "Report Form Inaccuracy" },
            ],
          };
        } else if (header.type === TableCellType.CMM_INPUT_VIEW_ICON) {
          record[header.key] = rowId;
        } else {
          record[header.key] = rowId || "--";
        }
        continue;
      }

      switch (header.type) {
        case TableCellType.MULTILINE: {
          record[header.key] = {
            mainText: resolveFieldValue(row, m, "main"),
            secondaryText: resolveFieldValue(row, m, "secondary"),
            hideCopyIcon: header.key === "dateOfBirth",
          };
          break;
        }
        case TableCellType.BADGE: {
          if (header.key === "noDataFields") {
            record[header.key] = buildMissingDataBadge(
              getNestedValue(row, m.mainField),
              getNestedValue(row, "missing_data.missing_data_count"),
            );
          } else {
            const text = resolveFieldValue(row, m, "main");
            record[header.key] = buildBadgeValue(text);
          }
          break;
        }
        case TableCellType.COPY_DATA: {
          record[header.key] = resolveFieldValue(row, m, "main");
          break;
        }
        case TableCellType.RECORD_CLOSED_BY: {
          const closedBy = resolveFieldValue(row, m, "main");
          const assigneeId = getNestedValue(row, "workflow.assignee_id") ?? "";
          const humanCheckDescription =
            getNestedValue(row, "record_closed_by.human_check_description") ??
            "";
          const humanAgent =
            getNestedValue(row, "record_closed_by.human_agent") ?? "";
          record[header.key] = {
            closedBy,
            assigneeId,
            humanCheckDescription,
            humanAgent,
          };
          break;
        }
        default: {
          record[header.key] = resolveFieldValue(row, m, "main");
          break;
        }
      }
    }

    record["id"] = rowId;
    record["rowData"] = JSON.stringify(row);

    return record;
  });
}
