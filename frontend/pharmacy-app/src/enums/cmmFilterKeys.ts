export enum CmmFilterKeys {
  FormName = "form_name",
  DateOfFiling = "date_of_filing",
  Status = "status",
  FormPickedVia = "form_picked_via",
  DrugName = "drug_name",
}

export enum FormPickedValues {
  RxDetails25 = "rx_details_25",
  RxDetails24 = "rx_details_24",
  Pbm = "pbm",
}

export enum DrugNameValues {
  AndroGel = "Androgel",
  Cialis = "Cialis",
  Lidocaine = "Lidocaine",
  Lidoderm = "Lidoderm",
  Mounjaro = "Mounjaro",
  Ozempic = "Ozempic",
  Semaglutide = "Semaglutide",
  Tadalafil = "Tadalafil",
  Testosterone = "Testosterone",
  Wegovy = "Wegovy",
  Zepbound = "Zepbound",
}

export enum StatusValues {
  Inaccuracy = "Inaccuracy",
  FormFilled = "Form Filled",
  SentToPlan = "Sent to plan",
  FormError = "Form Error",
  QaFetched = "QA Fetched",
}
