import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: "tsx",
  },
  define: {
    "import.meta.env.VITE_API_KEY": JSON.stringify(
      "AIzaSyAdrwUxkCA3LqNFwihb05Fq621WtEqiBK4"
    ),
  },
});
