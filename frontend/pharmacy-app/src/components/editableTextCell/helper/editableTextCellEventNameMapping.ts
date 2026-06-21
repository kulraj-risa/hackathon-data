import { EventsName } from "../../../enums/eventsName";
import { CptCodeWithDetailsKeys } from "../../../enums/tableColumnKeys";

export const editableTextCellEventNameMappingForClickAction = {
  [CptCodeWithDetailsKeys.StartFrom]: EventsName.FROM_DATE_CLICKED,
  [CptCodeWithDetailsKeys.EndAt]: EventsName.TO_DATE_CLICKED,
  [CptCodeWithDetailsKeys.JCodes]: EventsName.J_CODE_CLICKED,
  [CptCodeWithDetailsKeys.Visits]: EventsName.VISITS_CLICKED,
  [CptCodeWithDetailsKeys.VisitsAllowed]: EventsName.VISITS_ALLOWED_CLICKED,
  [CptCodeWithDetailsKeys.RemainingVisits]: EventsName.VISITS_REMAINING_CLICKED,
};

export const editableTextCellEventNameMappingForChangeAction = {
  [CptCodeWithDetailsKeys.StartFrom]: EventsName.FROM_DATE_CHANGED,
  [CptCodeWithDetailsKeys.EndAt]: EventsName.TO_DATE_CHANGED,
  [CptCodeWithDetailsKeys.JCodes]: EventsName.J_CODE_CHANGED,
  [CptCodeWithDetailsKeys.Visits]: EventsName.VISITS_CHANGED,
  [CptCodeWithDetailsKeys.VisitsAllowed]: EventsName.VISITS_ALLOWED_CHANGED,
  [CptCodeWithDetailsKeys.RemainingVisits]: EventsName.VISITS_REMAINING_CHANGED,
};
