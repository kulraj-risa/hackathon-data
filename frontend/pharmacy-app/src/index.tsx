import { datadogRum } from "@datadog/browser-rum";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import Toasts from "./components/toasts/toasts";
import { TablesContextProvider } from "./context/tablesContextProvider";
import { UserThemeContextProvider } from "./context/userThemeContext";
import "./index.css";
import store from "./redux/store/store";

const isDevelopment = process.env.REACT_APP_ENV !== "production";

// Initialize Datadog RUM
datadogRum.init({
  applicationId: "8797f218-79ca-4372-a88e-8c7b567a0828",
  clientToken: "pub008791ef8f6396d058a8a84badaf49e8",
  site: "us5.datadoghq.com",
  service: "provider-dashboard",
  env: isDevelopment ? "dev" : "prod",

  // Specify a version number to identify the deployed version of your application in Datadog
  version: "1.0.0",
  sessionSampleRate: 100,
  sessionReplaySampleRate: 100,
  defaultPrivacyLevel: "allow",

  // Configure allowed tracing URLs for connecting RUM to Traces
  allowedTracingUrls: [
    // Risa Labs APIs
    "https://api.risalabs.ai",
    "https://apis.risalabs.ai",
    "https://authentication.risalabs.ai",

    // Cloud Run services
    "https://cloudrun-rpa-service-939421517637.us-east1.run.app",
    "https://priorauth-dev-jj6e7pfhra-uc.a.run.app",
    "https://priorauth-jj6e7pfhra-uc.a.run.app",
    // Cloud Functions (rapids-platform)
    "https://us-central1-rapids-platform.cloudfunctions.net",

    // External APIs
    "https://clinicaltables.nlm.nih.gov",
    "https://secure15.oncoemr.com",

    // Matches any subdomain of risalabs.ai
    /^https:\/\/[^\/]+\.risalabs\.ai/,

    (url) => url.startsWith("https://pharmacy-dash-demo.web.app/"),
    (url) => url.startsWith("https://onco.risalabs.ai/auth"),
    (url) => url.startsWith("https://oncoboss.com/auth"),
  ],
  trackResources: true,
  trackLongTasks: true,
  trackUserInteractions: true,
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <UserThemeContextProvider>
        <TablesContextProvider>
          <Toasts />
          <App />
        </TablesContextProvider>
      </UserThemeContextProvider>
    </Provider>
  </React.StrictMode>,
);
