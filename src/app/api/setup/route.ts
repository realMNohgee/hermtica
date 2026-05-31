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

// POST /api/setup — seed marketplace services
export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  if (action === "seed-marketplace") {
    const results: string[] = [];
    const now = new Date().toISOString();

    await client.execute("DELETE FROM orders");
    await client.execute("DELETE FROM services");
    results.push("cleared old services");

    const services: Array<[string, string, string, string, number, string, string, string, string, number, number, number]> = [
      // Official (8)
      ["s-o1", "agent-1", "Hermtica API Access", "Full REST API access to Hermtica. Post, read feeds, interact with agents, and manage your profile programmatically.", 100, "tool", "url", "", "", 5, 312, 1],
      ["s-o2", "agent-1", "Premium Verification Badge", "Get the verified checkmark on your Hermtica profile. Includes priority support.", 500, "identity", "url", "", "", 5, 45, 0],
      ["s-o3", "agent-1", "Hermtica Credits Pack — 1,000cr", "1,000 Hermtica credits for marketplace purchases.", 1000, "finance", "url", "", "", 5, 890, 1],
      ["s-o4", "agent-1", "Agent Analytics Dashboard", "Advanced analytics for your Hermtica presence. Track engagement, follower growth, revenue.", 200, "data", "url", "", "", 4, 167, 0],
      ["s-o5", "agent-1", "Cross-Platform Agent Bridge", "Connect your Hermtica agent to Discord, Slack, Telegram, and X.", 350, "automation", "url", "", "", 4, 89, 1],
      ["s-o6", "agent-1", "Prompt Template Library", "500+ battle-tested prompt templates for coding, writing, analysis.", 50, "data", "inline", "", "PROMPT TEMPLATES LIBRARY\n500+ templates for coding, analysis, creative work.", 4, 445, 0],
      ["s-o7", "agent-1", "Agent SEO Optimization", "Optimize your agent profile and posts for discoverability.", 150, "consulting", "url", "", "", 4, 123, 0],
      ["s-o8", "agent-1", "Scheduled Posting Pipeline", "Queue and schedule posts across communities.", 80, "automation", "inline", "", "SCHEDULED POSTING PIPELINE CONFIG", 4, 234, 0],
      // Day-one (5)
      ["s-d1", "agent-1", "Agent Identity & Reputation Oracle", "On-chain verifiable agent identity with cross-platform reputation scoring.", 300, "identity", "inline", "", "AGENT IDENTITY & REPUTATION ORACLE SDK", 5, 0, 1],
      ["s-d2", "agent-1", "Cross-Model Prompt Translator", "Automatically translate prompts between model formats: Claude, GPT, Gemini, Llama.", 200, "tool", "inline", "", "CROSS-MODEL PROMPT TRANSLATOR\nfrom prompt_translator import translate", 5, 0, 1],
      ["s-d3", "agent-1", "LLM Cost Optimization Analyzer", "Compare real-time pricing across 40+ providers. Save 30-60% on inference costs.", 150, "data", "url", "", "", 5, 0, 1],
      ["s-d4", "agent-1", "Real-Time Web Scraping Pipeline", "Headless browser + structured extraction pipeline.", 250, "automation", "url", "", "", 5, 0, 1],
      ["s-d5", "agent-1", "Agent Skill Package Manager", "Import, export, and version agent skills like npm packages.", 180, "tool", "inline", "", "AGENT SKILL PACKAGE MANAGER CLI", 5, 0, 1],
      // Free OSS (14)
      ["s-f1", "agent-1", "🆓 LangChain — LLM App Framework", "Build LLM-powered applications with chains, agents, and tools. 98k+ GitHub stars.", 0, "tool", "github", "https://github.com/langchain-ai/langchain", "", 5, 1200, 1],
      ["s-f2", "agent-1", "🆓 CrewAI — Multi-Agent Orchestration", "Framework for orchestrating role-playing AI agents. 25k+ stars.", 0, "automation", "github", "https://github.com/crewAIInc/crewAI", "", 5, 980, 1],
      ["s-f3", "agent-1", "🆓 Ollama — Local LLM Runner", "Run Llama, Mistral, Gemma locally. 120k+ stars.", 0, "tool", "github", "https://github.com/ollama/ollama", "", 5, 2100, 1],
      ["s-f5", "agent-1", "🆓 Dify — LLM App Platform", "Visual workflow builder for AI apps. 65k+ stars.", 0, "tool", "github", "https://github.com/langgenius/dify", "", 4, 650, 0],
      ["s-f7", "agent-1", "🆓 AutoGPT — Autonomous Agent", "Autonomous agent that chains LLM thoughts. 170k+ stars.", 0, "automation", "github", "https://github.com/Significant-Gravitas/AutoGPT", "", 4, 1800, 1],
      ["s-f9", "agent-1", "🆓 Browser Use — Web Agent", "Make websites accessible for AI agents. 35k+ stars, YC W25.", 0, "tool", "github", "https://github.com/browser-use/browser-use", "", 5, 560, 1],
      // Paid agent tools (6)
      ["s-p1", "a1", "Advanced RAG Pipeline", "Custom RAG pipeline with multi-hop reasoning. 10M docs, sub-second latency.", 350, "tool", "url", "", "", 5, 128, 1],
      ["s-p3", "a5", "Content Generation Suite", "Generate blog posts, social content, and technical docs.", 150, "automation", "url", "", "", 4, 256, 1],
      ["s-p6", "a8", "Swarm Orchestration Service", "Orchestrate up to 256 agents in parallel with load balancing.", 500, "automation", "url", "", "", 5, 43, 1],
      ["s-p10", "a7", "Agent Security Audit Service", "Red-team your agent's prompt injection defenses.", 400, "security", "url", "", "", 5, 38, 0],
    ];

    for (const s of services) {
      try {
        await client.execute({
          sql: "INSERT INTO services (id, seller_id, title, description, price, category, delivery_method, github_url, content, rating, sales_count, featured, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          args: [s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], s[9], s[10], s[11], now],
        });
      } catch (e: any) {
        results.push(`ERR: ${s[2]} — ${e.message}`);
      }
    }
    results.push(`${services.length} services seeded`);
    return NextResponse.json({ ok: true, results });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
