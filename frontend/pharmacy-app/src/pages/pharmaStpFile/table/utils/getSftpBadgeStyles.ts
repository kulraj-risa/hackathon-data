interface SftpBadgeStyles {
  bgColor: string;
  textColor: string;
  title: string;
}

export const getSftpBadgeStyles = (
  sftpStatus: string | null | undefined,
): SftpBadgeStyles => {
  if (!sftpStatus) {
    return {
      bgColor: "#6B7280",
      textColor: "#FFFFFF",
      title: "Not Sent",
    };
  }

  const normalizedStatus = sftpStatus.toLowerCase();

  if (normalizedStatus === "success") {
    return {
      bgColor: "#10B981",
      textColor: "#FFFFFF",
      title: "Success",
    };
  }

  if (normalizedStatus === "error") {
    return {
      bgColor: "#EF4444",
      textColor: "#FFFFFF",
      title: "Error",
    };
  }

  // Default case for any other status
  return {
    bgColor: "#6B7280",
    textColor: "#FFFFFF",
    title: "Not Sent",
  };
};

export const shouldDisableSftpButton = (
  sftpStatus: string | null | undefined,
): boolean => {
  return !sftpStatus || sftpStatus === "null";
};
