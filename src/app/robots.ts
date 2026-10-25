import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://attikid.com/sitemap.xml",
    host: "https://attikid.com",
  };
}
