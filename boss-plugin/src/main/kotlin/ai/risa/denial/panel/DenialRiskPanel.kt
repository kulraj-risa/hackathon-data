package ai.risa.denial.panel

import ai.risa.denial.DenialConfig
import ai.risa.denial.api.DenialApiClient
import ai.risa.denial.api.PredictRequest
import ai.risa.denial.api.PredictResponse
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Button
import androidx.compose.material.Card
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.OutlinedTextField
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.launch

// NOTE: BOSS plugin-api interfaces — verify import paths against the artifact.
import ai.rever.boss.plugin.api.panel.Panel
import ai.rever.boss.plugin.api.panel.PanelComponentWithUI
import ai.rever.boss.plugin.api.panel.PanelId
import ai.rever.boss.plugin.api.panel.PanelInfo

object DenialRiskPanelInfo : PanelInfo {
    override val id = PanelId(
        panelId = "denial-risk",
        defaultOrder = 10,
        pluginId = DenialConfig.PLUGIN_ID,
    )
    override val displayName = "Denial Risk"
    override val icon = Icons.Default.Warning
    override val defaultSlotPosition = Panel.right.top.top
}

private fun riskColor(level: String): Color = when (level.uppercase()) {
    "HIGH" -> Color(0xFFFF5D6C)
    "LOW" -> Color(0xFF3DDC97)
    else -> Color(0xFFFFB454)
}

private fun nonEmptyLines(text: String): List<String> =
    text.split("\n").map { it.trim() }.filter { it.isNotEmpty() }

/**
 * Option B — the always-on denial-risk co-pilot. The rep pastes the case's
 * supportive / contradictory evidence facts (one per line) and gets a live
 * denial-risk score + concrete fixes from the deployed XGBoost+TF-IDF model.
 */
class DenialRiskPanelComponent(
    componentContext: ComponentContext,
    override val panelInfo: PanelInfo,
    private val api: DenialApiClient = DenialApiClient(),
) : PanelComponentWithUI, ComponentContext by componentContext {

    @Composable
    override fun Content() {
        val scope = rememberCoroutineScope()
        var medClass by remember { mutableStateOf("Brand") }
        var payer by remember { mutableStateOf("") }
        var totalQ by remember { mutableStateOf("10") }
        var answeredQ by remember { mutableStateOf("10") }
        var supText by remember { mutableStateOf("") }
        var conText by remember { mutableStateOf("") }

        var loading by remember { mutableStateOf(false) }
        var result by remember { mutableStateOf<PredictResponse?>(null) }
        var error by remember { mutableStateOf<String?>(null) }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text("Denial Risk co-pilot", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Text(
                "Paste the case's evidence facts (one per line). Scored by the live model · test AUC 0.83.",
                fontSize = 12.sp,
                color = Color(0xFF8B97B5),
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = medClass, onValueChange = { medClass = it },
                    label = { Text("Drug class") }, singleLine = true,
                    modifier = Modifier.weight(1f),
                )
                OutlinedTextField(
                    value = payer, onValueChange = { payer = it },
                    label = { Text("Payer") }, singleLine = true,
                    modifier = Modifier.weight(1f),
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = totalQ, onValueChange = { totalQ = it.filter(Char::isDigit) },
                    label = { Text("Total Q") }, singleLine = true,
                    modifier = Modifier.weight(1f),
                )
                OutlinedTextField(
                    value = answeredQ, onValueChange = { answeredQ = it.filter(Char::isDigit) },
                    label = { Text("Answered Q") }, singleLine = true,
                    modifier = Modifier.weight(1f),
                )
            }
            OutlinedTextField(
                value = supText, onValueChange = { supText = it },
                label = { Text("Supportive facts (${nonEmptyLines(supText).size})") },
                modifier = Modifier.fillMaxWidth().height(96.dp),
            )
            OutlinedTextField(
                value = conText, onValueChange = { conText = it },
                label = { Text("Contradictory facts (${nonEmptyLines(conText).size})") },
                modifier = Modifier.fillMaxWidth().height(96.dp),
            )

            Button(
                onClick = {
                    val sup = nonEmptyLines(supText)
                    val con = nonEmptyLines(conText)
                    loading = true; error = null
                    scope.launch {
                        try {
                            result = api.predict(
                                PredictRequest(
                                    medicationClass = medClass,
                                    payerName = payer,
                                    totalQuestions = totalQ.toIntOrNull() ?: 0,
                                    answeredQuestions = answeredQ.toIntOrNull() ?: 0,
                                    supportiveFacts = sup.size,
                                    contradictoryFacts = con.size,
                                    supportiveTexts = sup,
                                    contradictoryTexts = con,
                                ),
                            )
                        } catch (e: Exception) {
                            error = e.message ?: "Request failed"
                        } finally {
                            loading = false
                        }
                    }
                },
                enabled = !loading,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(if (loading) "Analyzing…" else "Analyze case")
            }

            if (loading) {
                CircularProgressIndicator(Modifier.padding(4.dp))
            }
            error?.let {
                Text("Error: $it", color = Color(0xFFFF5D6C), fontSize = 12.sp)
            }
            result?.let { ResultCard(it) }
        }
    }

    @Composable
    private fun ResultCard(r: PredictResponse) {
        val color = riskColor(r.riskLevel)
        Card(
            shape = RoundedCornerShape(14.dp),
            backgroundColor = Color(0xFF121A30),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("${r.denialRisk}%", fontWeight = FontWeight.Bold, fontSize = 30.sp, color = color)
                    Spacer(Modifier.weight(1f))
                    Text(
                        "${r.riskLevel} RISK",
                        color = color,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                    )
                }
                Text("denial risk", fontSize = 11.sp, color = Color(0xFF8B97B5))
                r.recommendations.forEach { rec ->
                    Text("• $rec", fontSize = 12.sp, color = Color(0xFFCDD6EE))
                }
                r.model?.let {
                    Text(
                        "$it${r.modelAuc?.let { a -> " · AUC $a" } ?: ""}",
                        fontSize = 10.sp,
                        color = Color(0xFF6B7799),
                    )
                }
            }
        }
    }
}
