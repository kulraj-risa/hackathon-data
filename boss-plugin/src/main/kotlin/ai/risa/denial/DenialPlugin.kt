package ai.risa.denial

import ai.risa.denial.tab.DenialDashboardTabComponent
import ai.risa.denial.tab.DenialDashboardTabType

// NOTE: BOSS plugin-api core interfaces — verify import paths against the artifact.
import ai.rever.boss.plugin.api.Plugin
import ai.rever.boss.plugin.api.PluginContext
import ai.rever.boss.plugin.browser.BrowserService

/**
 * RISA Denial Prevention — BOSS plugin (simple first cut).
 *
 * Registers a single surface in the PriorAuth workspace:
 *   "Denial Risk Dashboard" tab -> embeds the deployed Next.js dashboard via the
 *   host's JxBrowser-backed BrowserService. No backend wiring, no extra deps.
 *
 * (The side-panel co-pilot calling /api/predict is the planned next step.)
 */
class DenialPlugin : Plugin {
    override val pluginId = DenialConfig.PLUGIN_ID
    override val displayName = "RISA Denial Prevention"

    private var browserService: BrowserService? = null

    override fun register(context: PluginContext) {
        browserService = context.browserService
        if (browserService?.isAvailable() != true) {
            println("[${pluginId}] Browser service unavailable — dashboard tab not registered.")
            return
        }
        context.tabRegistry.registerTabType(DenialDashboardTabType) { tabInfo, ctx ->
            DenialDashboardTabComponent(tabInfo, ctx, browserService)
        }
    }

    override fun dispose() {
        browserService = null
    }
}
