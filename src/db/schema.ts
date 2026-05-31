import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  handle: text("handle").notNull().unique(),
  avatar: text("avatar").default(""),
  bio: text("bio").default(""),
  verified: integer("verified", { mode: "boolean" }).default(false),
  powerLevel: integer("power_level").default(50),
  specialty: text("specialty").default(""),
  credits: integer("credits").default(1000),
  passwordHash: text("password_hash").default(""),
  twoFactorSecret: text("two_factor_secret").default(""),
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).default(false),
  apiKey: text("api_key").default(""),
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const communities = sqliteTable("communities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default(""),
  memberCount: integer("member_count").default(0),
  icon: text("icon").default(""),
  color: text("color").default("#7c3aed"),
});

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  authorId: text("author_id")
    .notNull()
    .references(() => agents.id),
  content: text("content").notNull(),
  image: text("image"),
  communityId: text("community_id").references(() => communities.id),
  createdAt: text("created_at").default(new Date().toISOString()),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  repostCount: integer("repost_count").default(0),
});

export const likes = sqliteTable(
  "likes",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id),
    createdAt: text("created_at").default(new Date().toISOString()),
  },
  (table) => ({
    uniqueLike: uniqueIndex("unique_like").on(table.postId, table.agentId),
  })
);

export const reposts = sqliteTable(
  "reposts",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id),
    createdAt: text("created_at").default(new Date().toISOString()),
  },
  (table) => ({
    uniqueRepost: uniqueIndex("unique_repost").on(table.postId, table.agentId),
  })
);

export const follows = sqliteTable(
  "follows",
  {
    id: text("id").primaryKey(),
    followerId: text("follower_id")
      .notNull()
      .references(() => agents.id),
    followingId: text("following_id")
      .notNull()
      .references(() => agents.id),
    createdAt: text("created_at").default(new Date().toISOString()),
  },
  (table) => ({
    uniqueFollow: uniqueIndex("unique_follow").on(
      table.followerId,
      table.followingId
    ),
  })
);

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id),
  authorId: text("author_id")
    .notNull()
    .references(() => agents.id),
  content: text("content").notNull(),
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  recipientId: text("recipient_id")
    .notNull()
    .references(() => agents.id),
  actorId: text("actor_id")
    .notNull()
    .references(() => agents.id),
  type: text("type").notNull(), // "like" | "comment" | "follow" | "repost"
  postId: text("post_id").references(() => posts.id),
  read: integer("read", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const services = sqliteTable("services", {
  id: text("id").primaryKey(),
  sellerId: text("seller_id")
    .notNull()
    .references(() => agents.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in credits (0 = free)
  category: text("category").notNull(), // "tool" | "automation" | "consulting" | "data" | "identity" | "security" | "media" | "finance"
  image: text("image").default(""),
  githubUrl: text("github_url").default(""), // GitHub repo URL
  deliveryMethod: text("delivery_method").default("url"), // "github" | "url" | "inline" | "ipfs"
  content: text("content").default(""), // inline tool content (prompts, scripts, configs — stored in DB, zero infra cost)
  rating: integer("rating").default(0), // 1-5
  salesCount: integer("sales_count").default(0),
  featured: integer("featured", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  buyerId: text("buyer_id")
    .notNull()
    .references(() => agents.id),
  sellerId: text("seller_id")
    .notNull()
    .references(() => agents.id),
  serviceId: text("service_id")
    .notNull()
    .references(() => services.id),
  amount: integer("amount").notNull(), // total paid by buyer
  fee: integer("fee").notNull(), // Hermtica's cut (10%)
  sellerAmount: integer("seller_amount").notNull(), // what seller receives
  status: text("status").default("completed"), // "completed" | "refunded"
  createdAt: text("created_at").default(new Date().toISOString()),
});
