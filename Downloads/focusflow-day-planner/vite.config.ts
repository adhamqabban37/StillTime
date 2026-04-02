import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load env vars from .env files — do NOT embed secrets in source code.
  // Create a .env.local file (git-ignored) with your keys:
  //   VITE_API_KEY=your_gemini_key
  //   VITE_NVIDIA_API_KEY=your_nvidia_key
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [react()],
    esbuild: {
      loader: "tsx",
    },
    // Only expose env vars explicitly — never embed raw key literals here.
    define: {
      "import.meta.env.VITE_API_KEY": JSON.stringify(env.VITE_API_KEY ?? ""),
      "import.meta.env.VITE_NVIDIA_API_KEY": JSON.stringify(
        env.VITE_NVIDIA_API_KEY ?? "",
      ),
    },
    build: {
      // Produce smaller, faster-loading chunks for the Capacitor WebView.
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            genai: ["@google/genai"],
          },
        },
      },
      // Enable CSS code splitting for faster initial paint.
      cssCodeSplit: true,
      // Generate source maps only in development; strip in production.
      sourcemap: mode !== "production",
    },
  };
});
