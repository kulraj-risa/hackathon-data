package ai.risa.denial.tab

import ai.risa.denial.DenialConfig
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.arkivanov.decompose.ComponentContext
import com.arkivanov.essenty.lifecycle.doOnCreate
import com.arkivanov.essenty.lifecycle.doOnDestroy
import java.util.UUID
import kotlinx.coroutines.launch

// NOTE: BOSS plugin-api interfaces. Import paths follow the published
// `ai.rever.boss.api:plugin-api` docs; verify against the artifact if they move.
import ai.rever.boss.plugin.api.tab.TabComponentWithUI
import ai.rever.boss.plugin.api.tab.TabIcon
import ai.rever.boss.plugin.api.tab.TabInfo
import ai.rever.boss.plugin.api.tab.TabTypeId
import ai.rever.boss.plugin.api.tab.TabTypeInfo
import ai.rever.boss.plugin.browser.BrowserConfig
import ai.rever.boss.plugin.browser.BrowserHandle
import ai.rever.boss.plugin.browser.BrowserService
import ai.rever.boss.plugin.api.util.componentCoroutineScope

/** Tab type: the full RISA Denial Prevention dashboard (Next.js) embedded in BOSS. */
object DenialDashboardTabType : TabTypeInfo {
    override val typeId = TabTypeId(typeId = "denial-dashboard", pluginId = DenialConfig.PLUGIN_ID)
    override val displayName = "Denial Risk Dashboard"
    override val icon = Icons.Default.Warning
}

data class DenialDashboardTabInfo(
    override val id: String = UUID.randomUUID().toString(),
    override val title: String = "Denial Risk",
    val url: String = DenialConfig.DASHBOARD_URL,
) : TabInfo {
    override val typeId = DenialDashboardTabType.typeId
    override val icon = Icons.Default.Warning
    override val tabIcon: TabIcon? = null
}

/**
 * Option A — embeds the deployed dashboard as a native tab using the host's
 * JxBrowser-backed [BrowserService]. Zero changes to the web app.
 */
class DenialDashboardTabComponent(
    override val config: TabInfo,
    componentContext: ComponentContext,
    private val browserService: BrowserService?,
) : TabComponentWithUI, ComponentContext by componentContext {

    override val tabTypeInfo = DenialDashboardTabType
    private var browserHandle: BrowserHandle? = null

    init {
        lifecycle.doOnCreate {
            componentCoroutineScope().launch {
                val info = config as? DenialDashboardTabInfo ?: DenialDashboardTabInfo()
                browserHandle = browserService?.createBrowser(
                    BrowserConfig(url = info.url, enableDownloads = true),
                )
            }
        }
        lifecycle.doOnDestroy {
            browserHandle?.dispose()
            browserHandle = null
        }
    }

    @Composable
    override fun Content() {
        Box(modifier = Modifier.fillMaxSize()) {
            browserHandle?.Content()
                ?: CircularProgressIndicator(Modifier.align(Alignment.Center))
        }
    }
}
