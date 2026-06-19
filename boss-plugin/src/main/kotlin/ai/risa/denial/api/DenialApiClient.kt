package ai.risa.denial.api

import ai.risa.denial.DenialConfig
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Serializable
data class PredictRequest(
    @SerialName("case_id") val caseId: String = "boss",
    @SerialName("medication_class") val medicationClass: String = "Brand",
    @SerialName("payer_name") val payerName: String = "",
    @SerialName("total_questions") val totalQuestions: Int = 0,
    @SerialName("answered_questions") val answeredQuestions: Int = 0,
    @SerialName("supportive_facts") val supportiveFacts: Int = 0,
    @SerialName("contradictory_facts") val contradictoryFacts: Int = 0,
    @SerialName("supportive_texts") val supportiveTexts: List<String> = emptyList(),
    @SerialName("contradictory_texts") val contradictoryTexts: List<String> = emptyList(),
)

@Serializable
data class PredictResponse(
    @SerialName("denial_risk") val denialRisk: Double = 0.0,
    @SerialName("risk_level") val riskLevel: String = "MEDIUM",
    val recommendations: List<String> = emptyList(),
    val model: String? = null,
    @SerialName("model_auc") val modelAuc: Double? = null,
    @SerialName("record_id") val recordId: String? = null,
)

/** Thin coroutine wrapper over the deployed FastAPI denial-prediction endpoint. */
class DenialApiClient(
    private val baseUrl: String = DenialConfig.API_BASE_URL,
) {
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }
    private val http: HttpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build()

    /** POST /api/predict — score a single PA case. Throws on transport/HTTP error. */
    suspend fun predict(request: PredictRequest): PredictResponse = withContext(Dispatchers.IO) {
        val body = json.encodeToString(request)
        val httpRequest = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl/api/predict"))
            .timeout(Duration.ofSeconds(20))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build()

        val response = http.send(httpRequest, HttpResponse.BodyHandlers.ofString())
        if (response.statusCode() !in 200..299) {
            throw RuntimeException("Denial API ${response.statusCode()}: ${response.body()}")
        }
        json.decodeFromString<PredictResponse>(response.body())
    }
}
