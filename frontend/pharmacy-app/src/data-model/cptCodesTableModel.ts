export interface CptCodesTableRowModel {
  startFrom: StartFrom;
  endAt: EndAt;
  description: string;
  paRequired: PaRequired;
  visits: Visits;
  remainingVisits: RemainingVisits;
  visitsAllowed: VisitsAllowed;
  jCodes: {
    data: string;
    id: string;
    allowInputModification: boolean;
    hasError: boolean;
  };
  jCodeId: string;
}

export interface StartFrom {
  data: string;
  hasError: boolean;
}

export interface EndAt {
  data: string;
  hasError: boolean;
}

export interface PaRequired {
  text: string;
  textColor: string;
  bgColor: string;
  currentStatusId: string;
}

export interface Visits {
  data: string;
  hasError: boolean;
}

export interface RemainingVisits {
  data: string;
  hasError: boolean;
}

export interface VisitsAllowed {
  data: string;
  hasError: boolean;
}
