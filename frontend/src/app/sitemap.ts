import { MetadataRoute } from "next";
import { environment } from "src/constants/environments";
import { getNextRoutes } from "src/utils/getRoutes";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = getNextRoutes("./src/app");

  const baseUrl = environment.NEXT_PUBLIC_BASE_URL;
  const sitemap: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route || ""}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return sitemap;
}
