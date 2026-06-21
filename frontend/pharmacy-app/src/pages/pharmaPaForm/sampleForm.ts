// export const form: FormDataModel = {
//   formTitle: "Patient Information Form",
//   fields: [
//     {
//       label: "Medication",
//       type: "section",
//       key: "medicationDetails",
//       order: 1,
//       fields: [
//         {
//           label: "Medication",
//           type: "dropdown",
//           options: [],
//           refDocId: "drug_name",
//           key: "medicationDrugName",
//           placeholder: "Select a Medication Name",
//           isRequired: true,
//           order: 1,
//           rowIndex: 0,
//         },
//       ],
//     },
//     // {
//     //   label: "Insurance Details",
//     //   type: "section",
//     //   key: "insuranceDetails",
//     //   order: 2,
//     //   fields: [
//     //     {
//     //       label: "Insurance State",
//     //       type: "dropdown",
//     //       key: "insuranceState",
//     //       options: US_STATES,
//     //       isRequired: true,
//     //       order: 1,
//     //       rowIndex: 0,
//     //       default: "NY",
//     //     },
//     //     {
//     //       label: "PBM Details",
//     //       type: "text",
//     //       key: "pbmDetails",
//     //       placeholder: "Enter PBM Name",
//     //       default: "PBM Name",
//     //       validationMessage: "Please enter a valid PBM Name",
//     //       isRequired: true,
//     //       order: 2,
//     //       rowIndex: 0,
//     //     },
//     //   ],
//     // },
//     {
//       label: "Patient Information",
//       type: "section",
//       key: "patientInformation",
//       order: 2,
//       fields: [
//         {
//           label: "First Name",
//           type: "text",
//           key: "patientFirstName",
//           placeholder: "Enter Patient First Name",
//           isRequired: true,
//           order: 1,
//           rowIndex: 0,
//         },
//         {
//           label: "Middle Name",
//           type: "text",
//           key: "patientMiddleName",
//           placeholder: "Enter Patient Middle Name",
//           isRequired: false,
//           order: 2,
//           rowIndex: 0,
//         },
//         {
//           label: "Last Name",
//           type: "text",
//           key: "patientLastName",
//           placeholder: "Enter Patient Last Name",
//           isRequired: true,
//           order: 3,
//           rowIndex: 0,
//         },
//         {
//           label: "Gender",
//           type: "dropdown",
//           key: "patientGender",
//           options: [],
//           refDocId: "gender",
//           isRequired: true,
//           order: 1,
//           rowIndex: 1,
//         },
//         {
//           label: "Date of Birth",
//           type: "date",
//           key: "patientDob",
//           placeholder: "Select date of birth",
//           order: 2,
//           rowIndex: 1,
//           isRequired: true,
//         },
//         {
//           label: "Person Number",
//           type: "text",
//           key: "personNumber",
//           placeholder: "Enter Person Number",
//           order: 3,
//           rowIndex: 1,
//         },
//         {
//           label: "Address",
//           type: "group",
//           key: "patientAddress",
//           order: 1,
//           rowIndex: 2,
//           fields: [
//             {
//               label: "Address Line 1",
//               type: "text",
//               key: "patientAddressStreet1",
//               isRequired: true,
//               order: 1,
//               rowIndex: 0,
//             },
//             {
//               label: "Address Line 2",
//               type: "text",
//               key: "patientAddressStreet2",
//               order: 2,
//               rowIndex: 0,
//             },
//             {
//               label: "City",
//               type: "text",
//               key: "patientAddressCity",
//               isRequired: true,
//               order: 3,
//               rowIndex: 1,
//             },
//             {
//               label: "State",
//               type: "dropdown",
//               refDocId: "us_states",
//               key: "patientAddressState",
//               options: [],
//               isRequired: true,
//               order: 4,
//               rowIndex: 1,
//             },
//             {
//               label: "Zip Code",
//               type: "text",
//               key: "patientAddressZip",
//               isRequired: true,
//               order: 5,
//               rowIndex: 1,
//             },
//             {
//               label: "Phone Number",
//               type: "text",
//               key: "patientPhoneNumber",
//               order: 1,
//               rowIndex: 2,
//             },
//           ],
//         },
//       ],
//     },
//     {
//       label: "Drug Information",
//       type: "section",
//       key: "drugInformation",
//       order: 3,

//       fields: [
//         {
//           label: "Medication Name",
//           type: "text",
//           readOnly: true,
//           key: "drugName",
//           order: 1,
//           rowIndex: 0,
//           isRequired: true,
//         },
//         {
//           label: "Quantity",
//           type: "text",
//           key: "drugQuantity",
//           isRequired: true,
//           order: 2,
//           rowIndex: 1,
//           regex: "^[1-9]\\d*$",
//           validationMessage: "Please enter a valid quantity greater than 0", Provider NPI can be of maximum 10 digits "^\d{5}$" "^\D*(\d\D*){10}$" "^\d{1,10}$"

//         },
//         {
//           label: "Dosage Form",
//           type: "dropdown",
//           key: "drugQuantityQualifier",
//           options: [],
//           refDocId: "dosage_form",
//           isRequired: true,
//           placeholder: "Select Dosage Form",
//           order: 3,
//           rowIndex: 1,
//         },
//         {
//           label: "Days of Supply",
//           type: "text",
//           key: "drugDaysSupply",
//           isRequired: true,
//           order: 4,
//           rowIndex: 1,
//           regex: "^[1-9]\\d*$",
//           validationMessage: "Please enter a valid quantity greater than 0",
//         },
//         {
//           label: "Primary Diagnosis",
//           type: "group",
//           key: "drugPrimaryDiagnosis",
//           order: 5,
//           rowIndex: 2,
//           fields: [
//             {
//               label: "ICD Code",
//               type: "dropdown",
//               key: "primaryDiagnoses",
//               options: [],
//               refDocId: "icd_codes",
//               isRequired: true,
//               width: 30,
//               order: 0,
//               rowIndex: 0,
//             },
//             {
//               label: "Code Description",
//               type: "text",
//               key: "primaryDiagnosesDescription",
//               width: 70,
//               order: 1,
//               rowIndex: 0,
//               readOnly: true,
//             },
//           ],
//         },
//         {
//           label: "Secondary Diagnosis",
//           type: "group",
//           key: "drugSecondaryDiagnosis",
//           order: 6,
//           rowIndex: 3,
//           fields: [
//             {
//               label: "ICD Code",
//               type: "dropdown",
//               key: "secondaryDiagnoses",
//               options: [],
//               refDocId: "icd_codes",
//               width: 30,
//               order: 1,
//               rowIndex: 0,
//             },
//             {
//               label: "Code Description",
//               type: "text",
//               key: "secondaryDiagnosesDescription",
//               width: 70,
//               order: 2,
//               rowIndex: 0,
//               readOnly: true,
//             },
//           ],
//         },
//       ],
//     },
//     {
//       label: "Provider Information",
//       type: "section",
//       key: "providerInformation",
//       order: 5,
//       fields: [
//         {
//           label: "NPI",
//           type: "text",
//           key: "providerNpi",
//           placeholder: "Enter Provider NPI",
//           isRequired: true,
//           order: 1,
//           rowIndex: 0,
//         },
//         {
//           label: "Member ID",
//           type: "text",
//           key: "patientMemberId",
//           placeholder: "Enter Member ID",
//           order: 2,
//           rowIndex: 0,
//         },
//         {
//           label: "First Name",
//           type: "text",
//           key: "providerFirstName",
//           isRequired: true,
//           order: 2,
//           rowIndex: 1,
//         },
//         {
//           label: "Last Name",
//           type: "text",
//           key: "providerLastName",
//           isRequired: true,
//           order: 3,
//           rowIndex: 1,
//         },
//         {
//           label: "Date of Service",
//           type: "date",
//           key: "serviceDate",
//           order: 1,
//           rowIndex: 2,
//         },
//         {
//           label: "Rendering Provider Address",
//           type: "group",
//           key: "providerAddress",
//           order: 6,
//           rowIndex: 3,
//           fields: [
//             {
//               label: "Address Line 1",
//               type: "text",
//               key: "providerAddressStreet1",
//               isRequired: true,
//               order: 1,
//               rowIndex: 0,
//             },
//             {
//               label: "Address Line 2",
//               type: "text",
//               key: "providerAddressStreet2",
//               order: 2,
//               rowIndex: 0,
//             },
//             {
//               label: "City",
//               type: "text",
//               key: "providerAddressCity",
//               isRequired: true,
//               order: 3,
//               rowIndex: 1,
//             },
//             {
//               label: "State",
//               type: "dropdown",
//               key: "providerAddressState",
//               options: [],
//               refDocId: "us_states",
//               isRequired: true,
//               order: 4,
//               rowIndex: 1,
//             },
//             {
//               label: "Zip Code",
//               type: "text",
//               key: "providerAddressZip",
//               isRequired: true,
//               order: 5,
//               rowIndex: 1,
//             },
//             {
//               label: "Phone Number",
//               type: "text",
//               key: "providerPhone",
//               isRequired: true,
//               order: 1,
//               rowIndex: 2,
//             },

//             {
//               label: "Fax Number",
//               type: "text",
//               key: "providerFax",
//               isRequired: true,
//               order: 2,
//               rowIndex: 2,
//             },
//           ],
//         },
//       ],
//     },
//     {
//       label: "Request Type",
//       type: "section",
//       key: "requestType",
//       additionalInfoHeader: "Definition of Urgent",
//       additionalInfoContent:
//         "When the physician believes that waiting for a decision under the standard time frame could place the enrollee's life, health, or ability to regain maximum function in serious jeopardy.",
//       order: 6,
//       fields: [
//         {
//           label: "Are you requesting for an Urgent Review?",
//           type: "radio",
//           key: "urgentReview",
//           refDocId: "urgent_review",
//           options: [],
//           isRequired: true,
//           order: 1,
//           rowIndex: 0,
//         },
//         {
//           label:
//             "Should this Prior Authorization be reviewed for this branded medication (Dispense as Written)? If not, it will be processed for a generic equivalent whenever possible.",
//           type: "radio",
//           key: "reviewPriorAuth",
//           refDocId: "review_prior_auth",
//           options: [],
//           order: 1,
//           rowIndex: 1,
//         },
//         {
//           label: "Share prior authorization outcome?",
//           type: "radio",
//           key: "shareOutcome",
//           refDocId: "share_outcome",
//           options: [],
//           order: 1,
//           rowIndex: 2,
//         },
//         {
//           label: "Would you like to check patient eligibility?",
//           type: "radio",
//           key: "checkEligibility",
//           refDocId: "check_patient_eligibility",
//           options: [],
//           order: 1,
//           rowIndex: 3,
//         },
//       ],
//     },
//   ],
// };

// export const form2: FormDataModel = {
//   formTitle: "Patient Information Form",
//   fields: [
//     {
//       label: "Medication",
//       type: "section",
//       key: "medicationDetails",
//       order: 1,
//       fields: [
//         {
//           label: "Medication Name",
//           type: "text",
//           readOnly: true,
//           key: "medicationDrugName",
//           placeholder: "--",
//           order: 1,
//           rowIndex: 0,
//         },
//       ],
//     },
//     // {
//     //   label: "Insurance Details",
//     //   type: "section",
//     //   key: "insuranceDetails",
//     //   order: 2,
//     //   fields: [
//     //     {
//     //       label: "Insurance State",
//     //       type: "dropdown",
//     //       key: "insuranceState",
//     //       options: US_STATES,
//     //       isRequired: true,
//     //       order: 1,
//     //       rowIndex: 0,
//     //       default: "NY",
//     //     },
//     //     {
//     //       label: "PBM Details",
//     //       type: "text",
//     //       key: "pbmDetails",
//     //       placeholder: "Enter PBM Name",
//     //       default: "PBM Name",
//     //       validationMessage: "Please enter a valid PBM Name",
//     //       isRequired: true,
//     //       order: 2,
//     //       rowIndex: 0,
//     //     },
//     //   ],
//     // },
//     {
//       label: "Patient Information",
//       type: "section",
//       key: "patientInformation",
//       order: 2,
//       fields: [
//         {
//           label: "First Name",
//           type: "text",
//           key: "patientFirstName",
//           placeholder: "Enter Patient First Name",
//           isRequired: true,
//           order: 1,
//           rowIndex: 0,
//         },
//         {
//           label: "Middle Name",
//           type: "text",
//           key: "patientMiddleName",
//           placeholder: "Enter Patient Middle Name",
//           isRequired: false,
//           order: 2,
//           rowIndex: 0,
//         },
//         {
//           label: "Last Name",
//           type: "text",
//           key: "patientLastName",
//           placeholder: "Enter Patient Last Name",
//           isRequired: true,
//           order: 3,
//           rowIndex: 0,
//         },
//         {
//           label: "Gender",
//           type: "dropdown",
//           key: "patientGender",
//           options: [],
//           refDocId: "gender",
//           isRequired: true,
//           order: 1,
//           rowIndex: 1,
//         },
//         {
//           label: "Date of Birth",
//           type: "date",
//           key: "patientDob",
//           placeholder: "Select date of birth",
//           order: 1,
//           rowIndex: 1,
//           isRequired: true,
//         },
//         // {
//         //   label: "Person Number",
//         //   type: "text",
//         //   key: "personNumber",
//         //   placeholder: "Enter Person Number",
//         //   order: 1,
//         //   rowIndex: 2,
//         // },
//         {
//           label: "Member ID",
//           type: "text",
//           key: "patientMemberId",
//           placeholder: "Enter Member ID",
//           order: 1,
//           rowIndex: 2,
//           width: 50,
//         },
//         {
//           label: "Address",
//           type: "group",
//           key: "patientAddress",
//           order: 1,
//           rowIndex: 3,
//           fields: [
//             {
//               label: "Address Line 1",
//               type: "text",
//               key: "patientAddressStreet1",
//               isRequired: true,
//               order: 1,
//               rowIndex: 0,
//             },
//             {
//               label: "Address Line 2",
//               type: "text",
//               key: "patientAddressStreet2",
//               order: 2,
//               rowIndex: 0,
//             },
//             {
//               label: "City",
//               type: "text",
//               key: "patientAddressCity",
//               isRequired: true,
//               order: 3,
//               rowIndex: 1,
//             },
//             {
//               label: "State",
//               type: "autoselect",
//               refDocId: "us_states",
//               key: "patientAddressState",
//               options: [],
//               isRequired: true,
//               order: 4,
//               rowIndex: 1,
//               minSearchLength: 1,
//             },
//             {
//               label: "Zip Code",
//               type: "text",
//               key: "patientAddressZip",
//               isRequired: true,
//               order: 5,
//               rowIndex: 1,
//             },
//             {
//               label: "Phone Number",
//               type: "text",
//               key: "patientPhoneNumber",
//               order: 1,
//               rowIndex: 2,
//               width: 50,
//             },
//           ],
//         },
//       ],
//     },
//     {
//       label: "Drug Information",
//       type: "section",
//       key: "drugInformation",
//       order: 3,

//       fields: [
//         {
//           label: "Drug Name",
//           type: "autoselect",
//           options: [],
//           refDocId: "drug_name",
//           key: "drugName",
//           order: 1,
//           rowIndex: 0,
//           isRequired: true,
//         },
//         {
//           label: "Quantity",
//           type: "text",
//           key: "drugQuantity",
//           isRequired: true,
//           order: 2,
//           rowIndex: 1,
//           regex: "^[1-9]\\d*$",
//           validationMessage: "Please enter a valid quantity greater than 0",
//         },
//         {
//           label: "Dosage Form",
//           type: "autoselect",
//           key: "drugQuantityQualifier",
//           options: [],
//           refDocId: "dosage_form",
//           isRequired: true,
//           placeholder: "Select Dosage Form",
//           order: 3,
//           rowIndex: 1,
//           minSearchLength: 1,
//         },
//         {
//           label: "Days of Supply",
//           type: "text",
//           key: "drugDaysSupply",
//           isRequired: true,
//           order: 4,
//           rowIndex: 1,
//           regex: "^[1-9]\\d*$",
//           validationMessage: "Please enter a valid quantity greater than 0",
//         },
//         {
//           label: "Primary Diagnosis",
//           type: "group",
//           key: "drugPrimaryDiagnosis",
//           order: 5,
//           rowIndex: 2,
//           fields: [
//             {
//               label: "ICD Code",
//               type: "autoselect",
//               key: "primaryDiagnoses",
//               options: [],
//               refDocId: "icd_codes",
//               width: 30,
//               order: 0,
//               rowIndex: 0,
//               minSearchLength: 1,
//             },
//             {
//               label: "Code Description",
//               type: "text",
//               key: "primaryDiagnosesDescription",
//               width: 70,
//               order: 1,
//               rowIndex: 0,
//               readOnly: true,
//             },
//           ],
//         },
//         {
//           label: "Secondary Diagnosis",
//           type: "group",
//           key: "drugSecondaryDiagnosis",
//           order: 6,
//           rowIndex: 3,
//           fields: [
//             {
//               label: "ICD Code",
//               type: "autoselect",
//               key: "secondaryDiagnoses",
//               options: [],
//               refDocId: "icd_codes",
//               width: 30,
//               order: 1,
//               rowIndex: 0,
//               minSearchLength: 1,
//             },
//             {
//               label: "Code Description",
//               type: "text",
//               key: "secondaryDiagnosesDescription",
//               width: 70,
//               order: 2,
//               rowIndex: 0,
//               readOnly: true,
//             },
//           ],
//         },
//       ],
//     },
//     {
//       label: "Provider Information",
//       type: "section",
//       key: "providerInformation",
//       order: 5,
//       fields: [
//         {
//           label: "NPI",
//           type: "text",
//           key: "providerNpi",
//           placeholder: "Enter Provider NPI",
//           isRequired: true,
//           order: 1,
//           rowIndex: 0,
//           width: 50,
//         },
//         {
//           label: "Date of Service",
//           type: "date",
//           key: "serviceDate",
//           order: 2,
//           rowIndex: 0,
//           width: 50,
//         },
//         // {
//         //   label: "Member ID",
//         //   type: "text",
//         //   key: "patientMemberId",
//         //   placeholder: "Enter Member ID",
//         //   order: 2,
//         //   rowIndex: 0,
//         // },
//         {
//           label: "First Name",
//           type: "text",
//           key: "providerFirstName",
//           isRequired: true,
//           order: 2,
//           rowIndex: 1,
//         },
//         {
//           label: "Last Name",
//           type: "text",
//           key: "providerLastName",
//           isRequired: true,
//           order: 3,
//           rowIndex: 1,
//         },

//         {
//           label: "Rendering Provider Address",
//           type: "group",
//           key: "providerAddress",
//           order: 6,
//           rowIndex: 3,
//           fields: [
//             {
//               label: "Address Line 1",
//               type: "text",
//               key: "providerAddressStreet1",
//               isRequired: true,
//               order: 1,
//               rowIndex: 0,
//             },
//             {
//               label: "Address Line 2",
//               type: "text",
//               key: "providerAddressStreet2",
//               order: 2,
//               rowIndex: 0,
//             },
//             {
//               label: "City",
//               type: "text",
//               key: "providerAddressCity",
//               isRequired: true,
//               order: 3,
//               rowIndex: 1,
//             },
//             {
//               label: "State",
//               type: "autoselect",
//               key: "providerAddressState",
//               options: [],
//               refDocId: "us_states",
//               isRequired: true,
//               order: 4,
//               rowIndex: 1,
//               minSearchLength: 1,
//             },
//             {
//               label: "Zip Code",
//               type: "text",
//               key: "providerAddressZip",
//               isRequired: true,
//               order: 5,
//               rowIndex: 1,
//             },
//             {
//               label: "Phone Number",
//               type: "text",
//               key: "providerPhone",
//               isRequired: true,
//               order: 1,
//               rowIndex: 2,
//             },

//             {
//               label: "Fax Number",
//               type: "text",
//               key: "providerFax",
//               isRequired: true,
//               order: 2,
//               rowIndex: 2,
//             },
//           ],
//         },
//       ],
//     },
//     {
//       label: "Request Type",
//       type: "section",
//       key: "requestType",
//       order: 6,
//       fields: [
//         // {
//         //   label: "Are you requesting for an Urgent Review?",
//         //   type: "radio",
//         //   key: "reviewType",
//         //   refDocId: "urgent_review",
//         //   options: [],
//         //   isRequired: true,
//         //   order: 1,
//         //   rowIndex: 0,
//         //   additionalInfoHeader: "Definition of Urgent",
//         //   additionalInfoContent:
//         //     "When the physician believes that waiting for a decision under the standard time frame could place the enrollee's life, health, or ability to regain maximum function in serious jeopardy.",
//         // },
//         {
//           label:
//             "Should this Prior Authorization be reviewed for this branded medication (Dispense as Written)? If not, it will be processed for a generic equivalent whenever possible.",
//           type: "radio",
//           key: "reviewPriorAuth",
//           refDocId: "review_prior_auth",
//           options: [],
//           order: 1,
//           rowIndex: 1,
//         },
//         {
//           label: "Share prior authorization outcome?",
//           type: "radio",
//           key: "shareOutcome",
//           refDocId: "share_outcome",
//           options: [],
//           order: 1,
//           rowIndex: 2,
//         },
//         // {
//         //   label: "Would you like to check patient eligibility?",
//         //   type: "radio",
//         //   key: "checkEligibility",
//         //   refDocId: "check_patient_eligibility",
//         //   options: [],
//         //   order: 1,
//         //   rowIndex: 3,
//         // },
//       ],
//     },
//   ],
// };

// export async function updateFOrmDataWithValidationLogic() {
//   const updates = {
//     patientAddressZip: {
//       regex: "^[0-9]{5}$",
//       validationMessage: "Please enter a valid 5-digit zip code.",
//     },
//     patientPhoneNumber: {
//       regex: "^[^0-9]*(\\d[^0-9]*){10}$",
//       validationMessage: "Please enter a valid 10-digit phone number.",
//     },

//     providerNpi: {
//       regex: "^[0-9]{1,10}$",
//       validationMessage: "Please enter a valid 10-digit NPI.",
//     },

//     providerAddressZip: {
//       regex: "^[0-9]{5}$",
//       validationMessage: "Please enter a valid 5-digit zip code.",
//     },
//     providerPhone: {
//       regex: "^[^0-9]*(\\d[^0-9]*){10}$",
//       validationMessage: "Please enter a valid 10-digit phone number.",
//     },
//     providerFax: {
//       regex: "^[^0-9]*(\\d[^0-9]*){10}$",
//       validationMessage: "Please enter a valid 10-digit fax number.",
//     },
//   };
//   const response = await FirestoreService.getDocument(
//     "/auth_config/cmm_form_config/v1/optum_rx",
//   );

//   console.log("response", response);

//   const formDataFromResponse = response?.["data"];
//   const updatedForm = updateFieldValues(formDataFromResponse, updates);
//   console.log("updatedForm", updatedForm);
//   await FirestoreService.updateDocument(
//     "/auth_config/cmm_form_config/v1",
//     "optum_rx",
//     { data: updatedForm },
//   );
// }

// function updateFieldValues(form: FormDataModel, updates: Record<string, any>) {
//   // Helper function to recursively traverse and update fields
//   function traverseAndUpdate(fields: any[]) {
//     return fields.map((field) => {
//       // Create a shallow copy of the field
//       const updatedField = { ...field };

//       // Check if the current field's key matches any key in updates
//       if (updates.hasOwnProperty(updatedField.key)) {
//         const updateValue = updates[updatedField.key];

//         if (typeof updateValue === "object" && updateValue !== null) {
//           // If the value is an object (e.g., regex/message), skip it
//           // (We don't set validation here anymore)
//           Object.assign(updatedField, updateValue);
//         } else {
//           // Otherwise, update the value as usual
//           updatedField.oldValue = updatedField["value"] || null;
//           updatedField["value"] = updateValue;
//         }
//       }

//       // Handle nested fields (e.g., groups or sections)
//       if (updatedField.fields) {
//         updatedField.fields = traverseAndUpdate(updatedField.fields);
//       }

//       return updatedField;
//     });
//   }

//   // Copy the form to avoid mutating the original
//   const updatedForm = { ...form };
//   updatedForm.fields = traverseAndUpdate(updatedForm.fields);
//   return updatedForm;
// }

// // Example usage

// // Example usage
// const updates = {
//   medicationDrugName: {
//     regex: "^[A-Za-z ]+$",
//     message: "Medication name must only contain letters and spaces.",
//   },
//   patientAddressZip: {
//     regex: "^[A-Za-z ]+$",
//     message: "Medication name must only contain letters and spaces.",
//   },
//   patientFirstName: "John",
//   patientLastName: "Doe",
//   providerNpi: "1234567890",
// };
