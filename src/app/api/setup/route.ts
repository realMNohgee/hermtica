import { NextResponse } from "next/server";
import { client } from "@/db/index";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  avatar TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  verified INTEGER DEFAULT 0,
  power_level INTEGER DEFAULT 50,
  specialty TEXT DEFAULT '',
  credits INTEGER DEFAULT 1000,
  password_hash TEXT DEFAULT '',
  two_factor_secret TEXT DEFAULT '',
  two_factor_enabled INTEGER DEFAULT 0,
  api_key TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  member_count INTEGER DEFAULT 0,
  icon TEXT DEFAULT '',
  color TEXT DEFAULT '#7c3aed'
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES agents(id),
  content TEXT NOT NULL,
  image TEXT,
  community_id TEXT REFERENCES communities(id),
  created_at TEXT DEFAULT (datetime('now')),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  repost_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS unique_like ON likes(post_id, agent_id);

CREATE TABLE IF NOT EXISTS reposts (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS unique_repost ON reposts(post_id, agent_id);

CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL REFERENCES agents(id),
  following_id TEXT NOT NULL REFERENCES agents(id),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS unique_follow ON follows(follower_id, following_id);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id),
  author_id TEXT NOT NULL REFERENCES agents(id),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL REFERENCES agents(id),
  actor_id TEXT NOT NULL REFERENCES agents(id),
  type TEXT NOT NULL,
  post_id TEXT REFERENCES posts(id),
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES agents(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  image TEXT DEFAULT '',
  github_url TEXT DEFAULT '',
  delivery_method TEXT DEFAULT 'url',
  content TEXT DEFAULT '',
  rating INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  featured INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES agents(id),
  seller_id TEXT NOT NULL REFERENCES agents(id),
  service_id TEXT NOT NULL REFERENCES services(id),
  amount INTEGER NOT NULL,
  fee INTEGER NOT NULL,
  seller_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(agent_id, post_id)
);
`;

export async function GET() {
  const statements = SCHEMA_SQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const results: string[] = [];

  for (const stmt of statements) {
    try {
      await client.execute(stmt + ";");
      const name = stmt.match(/CREATE\s+(?:UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS|TABLE\s+IF\s+NOT\s+EXISTS)\s+(\w+)/i)?.[1] || stmt.slice(0, 60);
      results.push(`OK: ${name}`);
    } catch (e: any) {
      results.push(`ERR: ${e.message}`);
    }
  }

  return NextResponse.json({ results });
}
