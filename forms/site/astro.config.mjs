import react from "@astrojs/react";
import { defineConfig } from "astro/config";

import { FRONTEND_ROOT, sggFrontend } from "./src/vendor/sgg/vitePlugin.mjs";

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [sggFrontend()],
    resolve: {
      dedupe: ["react", "react-dom", "@trussworks/react-uswds"],
    },
    server: {
      // `../parity` compares each form page's fields with their Grants.gov sources.
      fs: { allow: [".", "../parity", FRONTEND_ROOT] },
    },
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
