import axios from "axios";
import { ApiBaseUrls } from "../enums/apiUrls";
import { logError } from "../utils/customLogger";

export async function proxyApiCallWrapper(
  body: object,
  url: string,
  token?: string,
) {
  const data = token
    ? {
        body: body,
        endpoint: url,
        access_token: token,
      }
    : {
        body: body,
        endpoint: url,
      };

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: ApiBaseUrls.PROXY_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  try {
    const response = await axios.request(config);

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(
        `Request failed with status ${response.status}: ${response.statusText}`,
      );
    }
  } catch (error) {
    logError(error as Error, "Error while making API request");
    throw error;
  }
}
