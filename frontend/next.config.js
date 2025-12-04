// @ts-check

const withNextIntl = require("next-intl/plugin")();
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

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    connect-src 'self' https://bam.nr-data.net https://www.google-analytics.com;
    base-uri 'self';
    media-src 'self';
    style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com/;
    script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com/ https://fonts.googleapis.com/ https://js-agent.newrelic.com/;
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
    `;

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: cspHeader.replace(/\n/g, ""),
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
];

const headers = [
  {
    // static pages are stored for 6 hours, refreshed in the background for
    // up to 10 minutes, and up to 12 hours if there is an error
    source: "/:path([A-Za-z0-9-_/?=]*)",
    headers: [
      {
        key: "Cache-Control",
        value:
          "s-maxage=21600, stale-while-revalidate=600, stale-if-error=43200",
      },
      {
        key: "Vary",
        value: "Accept-Language",
      },
    ],
  },
  // search page is stored 1 hour, stale 1 min, stale if error 5 mins
  {
    source: "/search",
    headers: [
      {
        key: "Cache-Control",
        value: "s-maxage=3600, stale-while-revalidate=60, stale-if-error=300",
      },
    ],
  },
  // opportunity pages are stored 10 mins, stale 1 min, stale if error 5 mins
  {
    source: "/opportunity/:id(\\d{1,})",
    headers: [
      {
        key: "Cache-Control",
        value: "s-maxage=600, stale-while-revalidate=60, stale-if-error=300",
      },
    ],
  },
  // don't cache the form
  {
    source: "/subscribe/:path*",
    headers: [
      {
        key: "Cache-Control",
        value: "no-store, must-revalidate",
      },
    ],
  },
  // don't cache the api
  {
    source: "/api/:path*",
    headers: [
      {
        key: "Cache-Control",
        value: "no-store, must-revalidate",
      },
    ],
  },
  // don't cache user specific pages: saved-opportunities, saved-search-queries
  {
    source: "/saved:path*",
    headers: [
      {
        key: "Cache-Control",
        value: "no-store, must-revalidate",
      },
    ],
  },
  // don't cache the user specific page for applications
  {
    source: "/applications",
    headers: [
      {
        key: "Cache-Control",
        value: "no-store, must-revalidate",
      },
    ],
  },
  // don't cache if users has a session cookie
  {
    source: "/:path*",
    has: [{ type: "cookie", key: "session" }],
    headers: [
      {
        key: "Cache-Control",
        value: "no-store, must-revalidate",
      },
    ],
  },
];

const isCi = Boolean(process.env.CI);

if (!isCi)
  headers.push({
    source: "/(.*)",
    headers: securityHeaders,
  });

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return headers;
  },
  // see https://nextjs.org/docs/messages/api-routes-response-size-limit
  // warning about unrecognized key can be ignored
  api: {
    bodyParser: {
      sizeLimit: "2000mb",
    },
  },
  basePath,
  reactStrictMode: true,
  // Output only the necessary files for a deployment, excluding irrelevant node_modules
  // https://nextjs.org/docs/app/api-reference/next-config-js/output
  output: "standalone",
  sassOptions: appSassOptions,
  serverExternalPackages: ["newrelic"],
  webpack: (config) => {
    nrExternals(config);
    return config;
  },
  eslint: {
    dirs: [
      "src",
      "stories",
      ".storybook",
      "tests",
      "scripts",
      "frontend",
      "lib",
      "types",
    ],
  },
  experimental: {
    testProxy: true,
    serverActions: {
      bodySizeLimit: "2000mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/process",
        destination: "/roadmap",
        permanent: false,
      },
      {
        source: "/subscribe",
        destination: "/newsletter",
        permanent: false,
      },
      {
        source: "/subscribe/confirmation",
        destination: "/newsletter/confirmation",
        permanent: false,
      },
      {
        source: "/subscribe/unsubscribe",
        destination: "/newsletter/unsubscribe",
        permanent: false,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
