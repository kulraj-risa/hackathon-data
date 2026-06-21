import { Prescription } from "../../../../data-model/prescriptionDataModal";

export const generateDrugDataForPrescription = (data: Prescription) => {
  const drugName = data?.prescription_description ?? "";
  const drugInstructions = data?.prescription_instructions ?? "";
  const dispenseAmount = data?.dispense_qty ?? "";
  const dispenseAmountString = data?.dispense_qty_string ?? "";
  const refillAmount = data?.refill_qty ?? "";
  const refillAmountString = data?.refill_qty_string ?? "";

  return [
    {
      header: "Drug Name",
      body: drugName,
    },
    {
      header: "Drug Instructions",
      body: drugInstructions,
    },
    {
      header: "Dispense Amount",
      body: `${dispenseAmount} (${dispenseAmountString})`,
    },
    {
      header: "Refill Amount",
      body: `${refillAmount} (${refillAmountString})`,
    },
  ];
};
