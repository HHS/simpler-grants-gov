// initial rules were absorbed from static robots.txt file

import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      process.env.AWS_ENVIRONMENT === "dev" // switching this temporarily to ensure that the variable is being set at AWS runtime as expected, will make it "prod" after confirming in Dev
        ? {
            userAgent: "*",
            allow: "/",
            disallow: [
              // don't disallow search for now as without a sitemap it's Google's only way of finding stuff
              // search is a high cost, low information subset of the opportunity page data, which is also available via the Sitemap (soon)
              // "/search",
              // Prevent crawling of Next.js build files.
              "/_next/",
              "/_next*",
              "/img/",
              "/*.json$",
              "/*_buildManifest.js$",
              "/*_middlewareManifest.js$",
              "/*_ssgManifest.js$",
              "/*.js$",
              // Prevent crawling of Next.js api routes.
              "/api/",
              // Prevent crawling of static assets in the public folder.
              "/public/",
            ],
          }
        : {
            userAgent: "*",
            disallow: "/",
          },
    ],
    // our sitemap isn't ready yet
    // sitemap: "https://acme.com/sitemap.xml",
  };
}
