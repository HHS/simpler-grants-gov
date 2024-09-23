import { MetadataRoute } from "next";

import { getNextRoutes } from "../utils/getRoutes";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = getNextRoutes("./src/app");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const sitemap: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route || ""}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return sitemap;
}
