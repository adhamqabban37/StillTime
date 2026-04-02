# ═══════════════════════════════════════════════════════════════════════════
# FocusFlow ProGuard / R8 Rules
# ═══════════════════════════════════════════════════════════════════════════

# ── Capacitor core ──────────────────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keepclassmembers class com.getcapacitor.** { *; }

# ── Capacitor plugins ───────────────────────────────────────────────────────
-keep class com.capacitorjs.plugins.localnotifications.** { *; }
-keep class com.capacitorjs.plugins.preferences.** { *; }

# ── App Widget ──────────────────────────────────────────────────────────────
-keep class com.focusflow.dayplanner.widget.** { *; }
-keepclassmembers class com.focusflow.dayplanner.widget.** { *; }

# ── JavaScript / WebView bridge ─────────────────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class * extends android.webkit.WebView {
    public *;
}
-keepattributes JavascriptInterface

# ── AndroidX / AppCompat ────────────────────────────────────────────────────
-keep class androidx.appcompat.** { *; }
-keep class androidx.core.** { *; }
-keep class androidx.coordinatorlayout.** { *; }
-keep class androidx.core.splashscreen.** { *; }
-dontwarn androidx.**

# ── JSON (org.json) ─────────────────────────────────────────────────────────
-keep class org.json.** { *; }

# ── Annotations & debug info ────────────────────────────────────────────────
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── WebView / network ───────────────────────────────────────────────────────
-dontwarn android.webkit.**

# ── Keep R classes (resource IDs must match widget layout) ──────────────────
-keepclassmembers class **.R$* {
    public static <fields>;
}

# ── Kotlin intrinsics (safe to suppress) ───────────────────────────────────
-dontwarn kotlin.**
-dontwarn kotlinx.**

