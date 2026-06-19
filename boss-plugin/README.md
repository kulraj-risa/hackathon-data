# RISA Denial Prevention — BOSS plugin (simple first cut)

Brings the [Denial Prevention Engine](../README.md) **into BOSS** (RISA's Business OS).
This first cut is intentionally minimal: a single **"Denial Risk Dashboard" tab** that
embeds the deployed Next.js dashboard via the host's `BrowserService` (JxBrowser).

- No backend wiring, no extra dependencies — a tiny `compileOnly`-only JAR.
- Lives in the **PriorAuth workspace** next to PA Dashboard / OncoEMR / CoverMyMeds.
- Dashboard URL is in `DenialConfig.kt`:
  `https://risa-denial-web-835676485453.us-central1.run.app`

> **Next step (not in this cut):** a "Denial Risk" side-panel co-pilot that POSTs
> evidence facts to `/api/predict` for a live score. Scaffolding for it lives in git
> history; we'll add it back once the tab is confirmed working in BOSS.

## Layout

```
boss-plugin/
  build.gradle.kts            Kotlin/Compose build — all deps compileOnly, plain JAR
  settings.gradle.kts         GitHub Packages repo for ai.rever.boss.api:plugin-api
  gradle.properties           versions + GitHub Packages credentials
  src/main/kotlin/ai/risa/denial/
    DenialPlugin.kt           entry point — registers the dashboard tab
    DenialConfig.kt           service URLs
    tab/DenialDashboardTab.kt  embedded dashboard tab
  src/main/resources/META-INF/boss-plugin/plugin.json   manifest (type "tab")
```

## Prerequisites

1. **JDK 17** and **Gradle 8.x** (e.g. `brew install gradle`). Run `gradle wrapper`
   once if you want a committed `./gradlew`.
2. A **GitHub Personal Access Token** with `read:packages` to pull the BOSS plugin
   API from GitHub Packages:

   ```bash
   export GITHUB_ACTOR=<your-github-username>
   export GITHUB_TOKEN=ghp_xxx_read_packages
   ```

   (or set `gpr.user` / `gpr.token` in `~/.gradle/gradle.properties`).

## Build

```bash
cd boss-plugin
gradle jar          # -> build/libs/risa-denial-boss-plugin-1.0.0.jar
```

## Install into BOSS

```bash
# macOS
cp build/libs/risa-denial-boss-plugin-1.0.0.jar "$HOME/Library/Application Support/BOSS/plugins/"
# Linux
cp build/libs/risa-denial-boss-plugin-1.0.0.jar "$HOME/.config/BOSS/plugins/"
```

Restart BOSS → open **PriorAuth** → **+ New Tab → Denial Risk Dashboard**.

## Known TODO

- **Verify API import paths.** The public docs give the interface *shapes*
  (Plugin / PluginContext / Tab* / BrowserService) but not every package. Imports
  here assume `ai.rever.boss.plugin.api.*` and `ai.rever.boss.plugin.browser.*`;
  adjust to match the resolved `ai.rever.boss.api:plugin-api` artifact if needed.
- **Decompose version** (`decomposeVersion`) should match the host's.
