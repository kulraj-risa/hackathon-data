export const determineTextColorOfTags = (insuranceType: string): string => {
  const insuranceTypeInLowerCase = insuranceType.toLowerCase();
  switch (insuranceTypeInLowerCase) {
    case "primary":
      return "text-tertiaryBlue-4";
    case "secondary":
      return "text-secondaryYellow-2";
    case "tertiary":
      return "text-secondaryOrange-2";
    case "pbm":
      return "text-secondaryPurple-4";
    default:
      return "text-primaryGray-1";
  }
};

export const determineBackgroundColorOfTags = (
  insuranceType: string,
): string => {
  const insuranceTypeInLowerCase = insuranceType.toLowerCase();
  switch (insuranceTypeInLowerCase) {
    case "primary":
      return "bg-tertiaryBlue-12";
    case "secondary":
      return "bg-secondaryYellow-11";
    case "tertiary":
      return "bg-secondaryOrange-12";
    case "pbm":
      return "bg-secondaryPurple-10";
    default:
      return "bg-primaryGray-16";
  }
};
