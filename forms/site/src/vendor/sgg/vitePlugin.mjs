// Lets the site import SGG frontend components straight from frontend/src (read-only):
//   - `@sgg/frontend/...` resolves to frontend/src/...
//   - inside frontend/src, its `src/...` imports resolve there too, and bare package imports
//     resolve from the site's node_modules (frontend/ is not installed alongside the site)
//   - Next-only modules those components reach are swapped for small stubs
//   - the packages they need are pre-bundled for `astro dev`
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
export const FRONTEND_ROOT = path.resolve(SITE_ROOT, "../../frontend");
const FRONTEND_SRC = path.join(FRONTEND_ROOT, "src");
const STUBS = fileURLToPath(new URL("./stubs/", import.meta.url));

const STUBBED = {
  "next-intl": "next-intl.ts",
  "next/navigation": "next-navigation.ts",
  "src/hooks/useClientFetch": "useClientFetch.ts",
  "public/img/uswds-sprite.svg": "uswds-sprite.ts",
};

/**
 * Packages the form preview reaches only through a client-only island and through
 * frontend/src, which Vite's startup scan never sees. Without pre-bundling them up front,
 * `astro dev` discovers them mid-request, re-bundles, and the page's imports 504 as
 * outdated. Production builds don't use this.
 */
const PREBUNDLE = [
  "@jsonforms/core",
  "@jsonforms/react",
  "@jsonforms/vanilla-renderers",
  "@nanostores/react",
  "@rjsf/utils",
  "@trussworks/react-uswds",
  "ajv/dist/2020.js",
  "ajv-formats",
  "clsx",
  "dayjs",
  "dayjs/plugin/advancedFormat",
  "dayjs/plugin/customParseFormat",
  "dayjs/plugin/localizedFormat",
  "dayjs/plugin/timezone",
  "json-pointer",
  "json-schema-merge-allof",
  "lodash",
  "lodash/noop",
  "nanostores",
  "shiki/core",
  "shiki/engine/javascript",
  "shiki/langs/json.mjs",
  "shiki/langs/xml.mjs",
  "shiki/themes/github-light.mjs",
];

const isBare = (source) =>
  !source.startsWith(".") &&
  !source.startsWith("/") &&
  !source.startsWith("\0");

export function sggFrontend() {
  return {
    name: "sgg-frontend",
    enforce: "pre",
    config: () => ({ optimizeDeps: { include: PREBUNDLE } }),
    async resolveId(source, importer, options) {
      const opts = { ...options, skipSelf: true };
      if (source.startsWith("@sgg/frontend/")) {
        const target = path.join(
          FRONTEND_SRC,
          source.slice("@sgg/frontend/".length),
        );
        return this.resolve(target, importer, opts);
      }
      const fromFrontend =
        importer?.startsWith(FRONTEND_ROOT) || importer?.startsWith(STUBS);
      if (!fromFrontend) return null;
      if (source in STUBBED) return path.join(STUBS, STUBBED[source]);
      if (source.startsWith("src/")) {
        return this.resolve(path.join(FRONTEND_ROOT, source), importer, opts);
      }
      if (isBare(source)) {
        return this.resolve(source, path.join(SITE_ROOT, "package.json"), opts);
      }
      return null;
    },
  };
}
