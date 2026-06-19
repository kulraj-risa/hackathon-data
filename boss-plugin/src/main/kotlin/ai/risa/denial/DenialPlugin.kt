package ai.risa.denial

import ai.risa.denial.api.DenialApiClient
import ai.risa.denial.panel.DenialRiskPanelComponent
import ai.risa.denial.panel.DenialRiskPanelInfo
import ai.risa.denial.tab.DenialDashboardTabComponent
import ai.risa.denial.tab.DenialDashboardTabType

// NOTE: BOSS plugin-api core interfaces — verify import paths against the artifact.
import ai.rever.boss.plugin.api.Plugin
import ai.rever.boss.plugin.api.PluginContext
import ai.rever.boss.plugin.browser.BrowserService

/**
 * RISA Denial Prevention — BOSS plugin entry point.
 *
 * Registers two surfaces in the PriorAuth workspace:
 *   A. "Denial Risk Dashboard" tab  -> embeds the deployed Next.js dashboard.
 *   B. "Denial Risk" side panel      -> live co-pilot calling /api/predict.
 */
class DenialPlugin : Plugin {
    override val pluginId = DenialConfig.PLUGIN_ID
    override val displayName = "RISA Denial Prevention"

    private val api = DenialApiClient()
    private var browserService: BrowserService? = null

    override fun register(context: PluginContext) {
        browserService = context.browserService

        // B — side-panel co-pilot.
        context.panelRegistry.registerPanel(DenialRiskPanelInfo) { ctx, info ->
            DenialRiskPanelComponent(ctx, info, api)
        }

        // A — embedded dashboard tab (only if the host browser engine is available).
        if (browserService?.isAvailable() == true) {
            context.tabRegistry.registerTabType(DenialDashboardTabType) { tabInfo, ctx ->
                DenialDashboardTabComponent(tabInfo, ctx, browserService)
            }
        }
    }

    override fun dispose() {
        browserService = null
    }
}
