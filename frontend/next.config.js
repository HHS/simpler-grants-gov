// @ts-check

const withNextIntl = require("next-intl/plugin")("./src/i18n/server.ts");
const sassOptions = require("./scripts/sassOptions");
const nrExternals = require("@newrelic/next/load-externals");

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
  async headers() {
    return [
      {
        // Static pages are 6 hours.
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=21600, stale-while-revalidate",
          },
        ],
      },
      // Search page is 1 hour.
      {
        source: "/search",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate",
          },
        ],
      },
      // Opportunity pages are 10 minutes.
      {
        source: "/opportunity/:id(\\d{1,})",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=600, stale-while-revalidate",
          },
        ],
      },
    ];
  },
  basePath,
  reactStrictMode: true,
  // Output only the necessary files for a deployment, excluding irrelevant node_modules
  // https://nextjs.org/docs/app/api-reference/next-config-js/output
  output: "standalone",
  sassOptions: appSassOptions,
  experimental: {
    serverComponentsExternalPackages: ["newrelic"],
  },
  webpack: (config) => {
    nrExternals(config);
    return config;
  },
};

module.exports = withNextIntl(nextConfig);
