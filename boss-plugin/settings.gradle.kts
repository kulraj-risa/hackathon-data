rootProject.name = "risa-denial-boss-plugin"

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        google()
        maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
    }
}

dependencyResolutionManagement {
    repositories {
        mavenCentral()
        google()
        maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")

        // BOSS Plugin API (published to GitHub Packages).
        // Requires a GitHub PAT with `read:packages` (see gradle.properties / env).
        maven {
            url = uri("https://maven.pkg.github.com/risa-labs-inc/BossConsole-Releases")
            credentials {
                username = System.getenv("GITHUB_ACTOR")
                    ?: (extra.properties["gpr.user"] as String?) ?: ""
                password = System.getenv("GITHUB_TOKEN")
                    ?: (extra.properties["gpr.token"] as String?) ?: ""
            }
        }
    }
}
