import { API_ENDPOINTS } from "../../enums/apiUrls";
import { LocalStorageKeys } from "../../enums/localStorageKeys";
import { logDataToConsole, logError } from "../../utils/customLogger";
import {
  getItemFromLocalStorage,
  setItemInLocalStorage,
} from "../../utils/localStorageHelper";

export async function getBearerToken() {
  const bearerToken = getItemFromLocalStorage(LocalStorageKeys.BEARER_TOKEN);
  if (bearerToken) {
    const expirationTime = bearerToken.expirationTime;
    if (expirationTime > new Date().getTime()) {
      return bearerToken.token;
    }
  }
  const url = API_ENDPOINTS.BEARER_TOKEN_URL;

  const requestBody = {
    username: process.env.REACT_APP_USERNAME,
    password: process.env.REACT_APP_PASSWORD,
  };

  try {
    const token = await fetch(url, {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await token.json();
    logDataToConsole(data);
    const expirationTime = new Date().getTime() + data.expiration_time * 1000;
    setItemInLocalStorage(LocalStorageKeys.BEARER_TOKEN, {
      token: data.access_token,
      expirationTime,
    });
    return data.access_token;
  } catch (error) {
    logError(error as Error, "Error while getting bearer token");
    return null;
  }
}
