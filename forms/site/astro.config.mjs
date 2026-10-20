import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [react()],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [
            "node_modules/@uswds/uswds/packages",
            "node_modules/@uswds/uswds/src/stylesheets",
          ],
        },
      },
    },
  },
});
