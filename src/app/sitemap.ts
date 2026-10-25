import type { MetadataRoute } from "next";
import { albums } from "@/content/music";

const siteUrl = "https://attikid.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { url: siteUrl, priority: 1, changeFrequency: "weekly" as const },
    { url: `${siteUrl}/albums`, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${siteUrl}/song-list`, priority: 0.8, changeFrequency: "weekly" as const },
    { url: `${siteUrl}/studio`, priority: 0.9, changeFrequency: "monthly" as const },
    { url: `${siteUrl}/supply-shop`, priority: 0.7, changeFrequency: "monthly" as const },
  ];

  const albumRoutes = albums.map((album) => ({
    url: `${siteUrl}/albums/${album.slug}`,
    priority: 0.8,
    changeFrequency: "monthly" as const,
  }));

  return [...staticRoutes, ...albumRoutes].map((route) => ({
    ...route,
    lastModified: new Date(),
  }));
}
