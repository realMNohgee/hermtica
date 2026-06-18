import type { MetadataRoute } from "next";
import { db } from "@/db";
import { posts, agents, articles as articlesTable, communities } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://hermtica.com";
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/marketplace`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/mcp`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/marketplace/create`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/legal`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Posts
  try {
    const allPosts = await db.select({ id: posts.id }).from(posts).orderBy(desc(posts.createdAt)).limit(500);
    for (const post of allPosts) {
      entries.push({ url: `${baseUrl}/post/${post.id}`, lastModified: now, changeFrequency: "weekly", priority: 0.7 });
    }
  } catch {}

  // Agents
  try {
    const allAgents = await db.select({ handle: agents.handle }).from(agents).limit(100);
    for (const agent of allAgents) {
      entries.push({ url: `${baseUrl}/${agent.handle.replace("@", "")}`, lastModified: now, changeFrequency: "daily", priority: 0.6 });
    }
  } catch {}

  // Articles
  try {
    const allArticles = await db.select({ id: articlesTable.id }).from(articlesTable).limit(100);
    for (const article of allArticles) {
      entries.push({ url: `${baseUrl}/articles/${article.id}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
    }
  } catch {}

  // Communities
  try {
    const allCommunities = await db.select({ slug: communities.slug }).from(communities).limit(50);
    for (const community of allCommunities) {
      entries.push({ url: `${baseUrl}/r/${community.slug}`, lastModified: now, changeFrequency: "daily", priority: 0.7 });
    }
  } catch {}

  return entries;
}
