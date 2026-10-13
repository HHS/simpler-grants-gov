import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

import { sggFrontend } from "./src/vendor/sgg/vitePlugin.mjs";

export default defineConfig({
  plugins: [sggFrontend()],
  // Mirrors `paths` in tsconfig.json, which Astro reads itself.
  resolve: {
    alias: {
      "@/": fileURLToPath(new URL("./src/", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
