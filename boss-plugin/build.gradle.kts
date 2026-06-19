import org.jetbrains.compose.desktop.application.dsl.TargetFormat

val composeVersion: String by project
val serializationVersion: String by project
val decomposeVersion: String by project

plugins {
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.serialization") version "2.1.0"
    id("org.jetbrains.compose") version "1.7.3"
    id("org.jetbrains.kotlin.plugin.compose") version "2.1.0"
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

group = "ai.risa.denial"
version = "1.0.0"

repositories {
    mavenCentral()
    google()
    maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
}

dependencies {
    // --- BOSS Plugin API: provided by the host at runtime -> compileOnly. ---
    compileOnly("ai.rever.boss.api:plugin-api-desktop:1.0.0")
    compileOnly("ai.rever.boss.api:plugin-api-browser-desktop:1.0.0")

    // --- Compose + Decompose: shared from the host -> compileOnly. ---
    compileOnly(compose.runtime)
    compileOnly(compose.foundation)
    compileOnly(compose.material)
    compileOnly(compose.ui)
    compileOnly("com.arkivanov.decompose:decompose:$decomposeVersion")

    // --- Bundled INTO the plugin jar (host may not provide these). ---
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:$serializationVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
}

kotlin {
    jvmToolchain(17)
}

// The plugin ships as a single fat JAR (with kotlinx-serialization bundled).
// compileOnly deps (host-provided) are correctly excluded by Shadow.
tasks.shadowJar {
    archiveBaseName.set("risa-denial-boss-plugin")
    archiveClassifier.set("")
    // Relocate the bundled serialization runtime to avoid clashing with any
    // copy already on the host classpath.
    relocate("kotlinx.serialization", "ai.risa.denial.shaded.serialization")
}

tasks.build {
    dependsOn(tasks.shadowJar)
}
