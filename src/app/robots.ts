import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://hermtica.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/api/mcp", "/api/health", "/api/og", "/api/og/"],
        disallow: ["/api/", "/dashboard/", "/settings/", "/login/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
