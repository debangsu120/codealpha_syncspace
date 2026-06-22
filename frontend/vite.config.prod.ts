import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
  plugins: [TanStackRouterVite({ target: "react", quoteStyle: "double" }), react(), tailwindcss(), tsConfigPaths()],
});
