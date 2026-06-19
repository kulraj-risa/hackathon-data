# RISA Denial Prevention — BOSS plugin

Brings the [Denial Prevention Engine](../README.md) **into BOSS** (RISA's Business OS)
so PA reps get denial risk where they already work — the **PriorAuth workspace**
(next to PA Dashboard / OncoEMR / CoverMyMeds).

It registers two surfaces (`type: "mixed"`):

| Surface | What it does |
|---------|--------------|
| **A · "Denial Risk Dashboard" tab** | Embeds the deployed Next.js dashboard via the host `BrowserService` (JxBrowser). Zero changes to the web app. |
| **B · "Denial Risk" side panel** | Always-on co-pilot: paste the case's supportive / contradictory evidence facts → live denial-risk % + concrete fixes from the deployed XGBoost + TF-IDF model (`/api/predict`, test AUC 0.83). |

Both talk to the already-deployed Cloud Run services (see `DenialConfig.kt`):
- API  `https://risa-denial-api-835676485453.us-central1.run.app`
- Web  `https://risa-denial-web-835676485453.us-central1.run.app`

## Layout

```
boss-plugin/
  build.gradle.kts            Kotlin/Compose plugin build (compileOnly host APIs + shadow jar)
  settings.gradle.kts         GitHub Packages repo for ai.rever.boss.api:plugin-api
  gradle.properties           versions + GitHub Packages credentials
  src/main/kotlin/ai/risa/denial/
    DenialPlugin.kt           entry point — registers panel + tab
    DenialConfig.kt           service URLs
    api/DenialApiClient.kt    HTTP client -> POST /api/predict
    tab/DenialDashboardTab.kt  (A) embedded dashboard tab
    panel/DenialRiskPanel.kt   (B) side-panel co-pilot (Compose UI)
  src/main/resources/META-INF/boss-plugin/plugin.json   manifest
```

## Prerequisites

1. **JDK 17** and **Gradle 8.x** (or run `gradle wrapper` once to get `./gradlew`).
2. A **GitHub Personal Access Token** with `read:packages` scope to pull the BOSS
   plugin API from GitHub Packages. Provide it via env vars:

   ```bash
   export GITHUB_ACTOR=<your-github-username>
   export GITHUB_TOKEN=ghp_xxx_read_packages
   ```

   or in `~/.gradle/gradle.properties` (`gpr.user` / `gpr.token`).

## Build

```bash
cd boss-plugin
gradle shadowJar         # or ./gradlew shadowJar after `gradle wrapper`
# -> build/libs/risa-denial-boss-plugin-1.0.0.jar
```

## Install into BOSS

Drop the JAR into the BOSS plugins directory and restart (or hot-load if supported):

```bash
# macOS
cp build/libs/risa-denial-boss-plugin-1.0.0.jar "$HOME/Library/Application Support/BOSS/plugins/"
# Linux
cp build/libs/risa-denial-boss-plugin-1.0.0.jar "$HOME/.config/BOSS/plugins/"
```

Then in BOSS: open the **PriorAuth** workspace → the **Denial Risk** panel appears
in the right sidebar, and **+ New Tab → Denial Risk Dashboard** opens the embedded app.

## Notes / known TODOs

- **Verify API import paths.** The public plugin docs describe the interface
  *shapes* (Plugin / PluginContext / Panel* / Tab* / BrowserService) but not every
  fully-qualified package. Imports here assume `ai.rever.boss.plugin.api.*` and
  `ai.rever.boss.plugin.browser.*`; adjust to match the resolved
  `ai.rever.boss.api:plugin-api` artifact if the compiler complains.
- **Decompose version** (`decomposeVersion` in `gradle.properties`) should match the
  host's so `ComponentContext` / lifecycle types are compatible (kept `compileOnly`).
- **Roadmap — RPA gate (Option C):** register a headless `type: "service"` plugin in
  BOSS's Task Resolver / LLM-RPA registry so the model runs as a *pre-submission
  guardrail* during automated PA filing. Needs RISA's internal service API (not in
  the public plugin docs yet).
