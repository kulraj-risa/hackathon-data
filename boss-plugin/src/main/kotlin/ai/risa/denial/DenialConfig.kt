package ai.risa.denial

/** Central config for the deployed RISA Denial Prevention services (Cloud Run). */
object DenialConfig {
    /** FastAPI inference + de-identified data API. */
    const val API_BASE_URL = "https://risa-denial-api-835676485453.us-central1.run.app"

    /** Next.js dashboard (embedded as a BOSS browser tab). */
    const val DASHBOARD_URL = "https://risa-denial-web-835676485453.us-central1.run.app"

    const val PLUGIN_ID = "ai.risa.denial"
}
