import moment from "moment";

export const calculateAge = (dateOfBirth: string | undefined): string => {
  if (!dateOfBirth || dateOfBirth === "N/A") return "N/A";
  const age = moment().diff(moment(dateOfBirth), "years");
  return age >= 0 ? `${age}` : "N/A";
};
