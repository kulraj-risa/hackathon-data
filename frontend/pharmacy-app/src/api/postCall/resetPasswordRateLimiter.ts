import { API_ENDPOINTS } from "../../enums/apiUrls";
import { logError } from "../../utils/customLogger";
import { getBearerToken } from "./bearerToken";

export const resetPasswordRateLimiter = async (email: string) => {
  const url = API_ENDPOINTS.CHECK_RATE_LIMIT_PASSWORD_RESET;
  const token = await getBearerToken();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (response.status >= 400 && response.status < 500) {
    const errorMessage =
      response.status === 429
        ? "Rate limit exceeded. Please try again later."
        : `Request failed with status ${response.status}`;

    logError(new Error(errorMessage));
    throw new Error(errorMessage);
  }

  if (response.status >= 500) {
    throw new Error("Internal server error. Please try again later.");
  }

  const data = await response.json();
  return data;
};
