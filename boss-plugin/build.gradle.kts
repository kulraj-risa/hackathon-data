val composeVersion: String by project
val decomposeVersion: String by project

plugins {
    kotlin("jvm") version "2.1.0"
    id("org.jetbrains.compose") version "1.7.3"
    id("org.jetbrains.kotlin.plugin.compose") version "2.1.0"
}

group = "ai.risa.denial"
version = "1.0.0"

repositories {
    mavenCentral()
    google()
    maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
}

dependencies {
    // Everything is provided by the BOSS host at runtime -> compileOnly.
    // This keeps the plugin a tiny, dependency-free JAR.
    compileOnly("ai.rever.boss.api:plugin-api-desktop:1.0.0")
    compileOnly("ai.rever.boss.api:plugin-api-browser-desktop:1.0.0")

    compileOnly(compose.runtime)
    compileOnly(compose.foundation)
    compileOnly(compose.material)
    compileOnly(compose.ui)
    compileOnly("com.arkivanov.decompose:decompose:$decomposeVersion")
    compileOnly("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
}

kotlin {
    jvmToolchain(17)
}

tasks.jar {
    archiveBaseName.set("risa-denial-boss-plugin")
}
