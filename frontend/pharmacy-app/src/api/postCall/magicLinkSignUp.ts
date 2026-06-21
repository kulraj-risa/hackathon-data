import { ApiBaseUrls } from "../../enums/apiUrls";
import { logDataToConsole, logError } from "../../utils/customLogger";
import { getBearerToken } from "./bearerToken";

export interface MagicLinkSignUpPayload {
  email: string;
  env: "production" | "staging";
  action_code_url: string;
}

export interface MagicLinkSignUpResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Makes a POST call to the magic link signup endpoint
 * @param payload - The magic link signup payload
 * @returns Promise<MagicLinkSignUpResponse>
 */
export const makeMagicLinkSignUpCall = async (
  payload: MagicLinkSignUpPayload,
): Promise<MagicLinkSignUpResponse> => {
  try {
    logDataToConsole("Making magic link signup call with payload", payload);

    const token = await getBearerToken();

    if (!token) {
      throw new Error("Bearer token not available");
    }

    const response = await fetch(`${ApiBaseUrls.AUTH_URL}/magic-link-signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logError(
        new Error(
          `Magic link signup failed: ${response.status} ${response.statusText}`,
        ),
        errorText,
      );
      return {
        success: false,
        message: `Request failed with status ${response.status}: ${response.statusText}`,
      };
    }

    const responseData = await response.json();
    logDataToConsole("Magic link signup successful", responseData);

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    logError(error as Error, "Error in makeMagicLinkSignUpCall");
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Convenience function to send magic link signup with default parameters
 * @param email - User email address
 * @param env - Environment (production or staging)
 * @returns Promise<MagicLinkSignUpResponse>
 */
export const sendMagicLinkSignUp = async (
  email: string,
  env: "production" | "staging" = "production",
): Promise<MagicLinkSignUpResponse> => {
  const payload: MagicLinkSignUpPayload = {
    email,
    env,
    action_code_url: "https://pharmacy-dash-demo.web.app/finishSignIn",
  };

  return makeMagicLinkSignUpCall(payload);
};
