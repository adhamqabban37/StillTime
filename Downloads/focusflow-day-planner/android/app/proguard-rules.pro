# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep Capacitor WebView classes
-keep class com.getcapacitor.** { *; }
-keepclassmembers class com.getcapacitor.** { *; }

# Keep all JavaScript interface methods for WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebView classes
-keepclassmembers class * extends android.webkit.WebView {
   public *;
}

# Keep JavaScript-accessible methods in Android native code
-keepattributes *Annotation*
-keepattributes JavascriptInterface

# Preserve line numbers for debugging stack traces
-keepattributes SourceFile,LineNumberTable

# Don't warn about missing classes
-dontwarn android.webkit.**

# Keep source file names for better crash reports
-renamesourcefileattribute SourceFile
