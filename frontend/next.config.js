// @ts-check
const { i18n } = require("./next-i18next.config");
const sassOptions = require("./scripts/sassOptions");

/**
 * Configure the base path for the app. Useful if you're deploying to a subdirectory (like GitHub Pages).
 * If this is defined, you'll need to set the base path anywhere you use relative paths, like in
 * `<a>`, `<img>`, or `<Image>` tags. Next.js handles this for you automatically in `<Link>` tags.
 * @see https://nextjs.org/docs/api-reference/next.config.js/basepath
 * @example "/test" results in "localhost:3000/test" as the index page for the app
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
const appSassOptions = sassOptions(basePath);

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  i18n,
  reactStrictMode: true,
  // Output only the necessary files for a deployment, excluding irrelevant node_modules
  // https://nextjs.org/docs/app/api-reference/next-config-js/output
  output: "standalone",
  sassOptions: appSassOptions,
  transpilePackages: [
    // Continue to support older browsers (ES5)
    // https://github.com/i18next/i18next/issues/1948
    "i18next",
  ],
};

module.exports = nextConfig;
