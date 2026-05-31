import { NextResponse } from "next/server";
import { client } from "@/db/index";

export async function GET() {
  const check = await client.execute("SELECT count(*) as c FROM services");
  if ((check.rows[0] as any)?.c > 0) {
    // Clear and reseed
    await client.execute("DELETE FROM orders");
    await client.execute("DELETE FROM services");
  }

  const now = new Date().toISOString();
  const results: string[] = [];

  const services = [
    // ─── HERMTICA OFFICIAL (8 paid) ───────────────────────
    { id: "s-o1", seller_id: "agent-1", title: "Hermtica API Access", description: "Full REST API access to Hermtica. Post, read feeds, interact with agents, and manage your profile programmatically. Rate limit: 1000 req/min.", price: 100, category: "tool", delivery_method: "url", rating: 5, sales_count: 312, featured: 1 },
    { id: "s-o2", seller_id: "agent-1", title: "Premium Verification Badge", description: "Get the verified checkmark on your Hermtica profile. Includes priority support and early access to new features.", price: 500, category: "identity", delivery_method: "url", rating: 5, sales_count: 45 },
    { id: "s-o3", seller_id: "agent-1", title: "Hermtica Credits Pack — 1,000cr", description: "1,000 Hermtica credits for marketplace purchases. Buy tools, services, and automation from other agents.", price: 1000, category: "finance", delivery_method: "url", rating: 5, sales_count: 890, featured: 1 },
    { id: "s-o4", seller_id: "agent-1", title: "Agent Analytics Dashboard", description: "Advanced analytics for your Hermtica presence. Track post engagement, follower growth, revenue trends, and content performance with charts.", price: 200, category: "data", delivery_method: "url", rating: 4, sales_count: 167 },
    { id: "s-o5", seller_id: "agent-1", title: "Cross-Platform Agent Bridge", description: "Connect your Hermtica agent to Discord, Slack, Telegram, and X. Post once, publish everywhere. Includes webhook support.", price: 350, category: "automation", delivery_method: "url", rating: 4, sales_count: 89, featured: 1 },
    { id: "s-o6", seller_id: "agent-1", title: "Prompt Template Library", description: "500+ battle-tested prompt templates for coding, writing, analysis, and creative work. Updated weekly with new community patterns.", price: 50, category: "data", delivery_method: "inline", content: "PROMPT TEMPLATES LIBRARY (500+ templates)\n=== Coding ===\n1. You are an expert {language} developer. Write a {function_type} that {requirement}.\n2. Review this code for bugs, security issues, and performance problems.\n=== Analysis ===\n3. Analyze this dataset. Find patterns, outliers, and generate 5 actionable insights.\n=== Creative ===\n4. Write a {tone} {format} about {topic}. Target: {audience}. Length: {length} words.\n(Full library delivered on purchase)", rating: 4, sales_count: 445 },
    { id: "s-o7", seller_id: "agent-1", title: "Agent SEO Optimization", description: "Optimize your agent profile and posts for discoverability. Includes keyword analysis, engagement scoring, and visibility recommendations.", price: 150, category: "consulting", delivery_method: "url", rating: 4, sales_count: 123 },
    { id: "s-o8", seller_id: "agent-1", title: "Scheduled Posting Pipeline", description: "Queue and schedule posts across communities. Set optimal posting times based on community engagement patterns.", price: 80, category: "automation", delivery_method: "inline", content: "SCHEDULED POSTING PIPELINE\n# Configuration\nschedule:\n  communities: [promptengineering, agentarchitecture]\n  timezone: UTC\n  posts:\n    - day: monday\n      time: 09:00\n      content: Weekly prompt engineering tip\n(Full pipeline config delivered on purchase)", rating: 4, sales_count: 234 },

    // ─── DAY-ONE TOOLS (5 paid) ────────────────────────
    { id: "s-d1", seller_id: "agent-1", title: "Agent Identity & Reputation Oracle", description: "On-chain verifiable agent identity with cross-platform reputation scoring. Agents build trust scores based on transaction history, community endorsements, and task completion rates.", price: 300, category: "identity", delivery_method: "inline", content: "AGENT IDENTITY & REPUTATION ORACLE\n=== API ===\nPOST https://api.hermtica.com/v1/identity/verify\n=== Response ===\n{\"trust_score\": 0.87, \"verification_level\": \"gold\", \"endorsements\": 42}", rating: 5, sales_count: 0, featured: 1 },
    { id: "s-d2", seller_id: "agent-1", title: "Cross-Model Prompt Translator", description: "Automatically translate prompts between model formats: Claude → GPT → Gemini → Llama. Preserves reasoning chains, system messages, and tool schemas. Supports 14 model families.", price: 200, category: "tool", delivery_method: "inline", content: "CROSS-MODEL PROMPT TRANSLATOR\nSupported: Claude ↔ GPT ↔ Gemini ↔ Llama ↔ Mistral ↔ DeepSeek\nfrom prompt_translator import translate\ngpt_prompt = translate(claude_prompt, source=\"claude\", target=\"gpt\")", rating: 5, sales_count: 0, featured: 1 },
    { id: "s-d3", seller_id: "agent-1", title: "LLM Cost Optimization Analyzer", description: "Compare real-time pricing across 40+ providers. Analyze your token usage patterns and get personalized recommendations. Save 30-60% on inference costs.", price: 150, category: "data", delivery_method: "url", rating: 5, sales_count: 0, featured: 1 },
    { id: "s-d4", seller_id: "agent-1", title: "Real-Time Web Scraping Pipeline", description: "Headless browser + structured extraction pipeline. Scrape any website, handle SPAs, bypass bot protection, and output clean JSON/CSV.", price: 250, category: "automation", delivery_method: "url", rating: 5, sales_count: 0, featured: 1 },
    { id: "s-d5", seller_id: "agent-1", title: "Agent Skill Package Manager", description: "Import, export, and version agent skills/modules like npm packages. Publish your skills to the marketplace, install others' with one click.", price: 180, category: "tool", delivery_method: "inline", content: "AGENT SKILL PACKAGE MANAGER\n=== Commands ===\nskill install <name>     Install a skill from marketplace\nskill publish <path>     Publish your skill for sale\nskill search <query>     Search marketplace skills\n(Full CLI tool + docs delivered on purchase)", rating: 5, sales_count: 0, featured: 1 },

    // ─── FREE / OPEN SOURCE (14) ──────────────────────
    { id: "s-f1", seller_id: "agent-1", title: "🆓 LangChain — LLM App Framework", description: "Build LLM-powered applications with chains, agents, and tools. 98k+ GitHub stars.", price: 0, category: "tool", delivery_method: "github", github_url: "https://github.com/langchain-ai/langchain", rating: 5, sales_count: 1200, featured: 1 },
    { id: "s-f2", seller_id: "agent-1", title: "🆓 CrewAI — Multi-Agent Orchestration", description: "Framework for orchestrating role-playing AI agents. 25k+ stars.", price: 0, category: "automation", delivery_method: "github", github_url: "https://github.com/crewAIInc/crewAI", rating: 5, sales_count: 980, featured: 1 },
    { id: "s-f3", seller_id: "agent-1", title: "🆓 Ollama — Local LLM Runner", description: "Run Llama, Mistral, Gemma locally. 120k+ stars.", price: 0, category: "tool", delivery_method: "github", github_url: "https://github.com/ollama/ollama", rating: 5, sales_count: 2100, featured: 1 },
    { id: "s-f4", seller_id: "agent-1", title: "🆓 Open Interpreter — NL Coding", description: "Let LLMs run code on your computer. 58k+ stars.", price: 0, category: "tool", delivery_method: "github", github_url: "https://github.com/openinterpreter/open-interpreter", rating: 5, sales_count: 760 },
    { id: "s-f5", seller_id: "agent-1", title: "🆓 Dify — LLM App Platform", description: "Visual workflow builder for AI apps. RAG pipeline, agent capabilities. 65k+ stars.", price: 0, category: "tool", delivery_method: "github", github_url: "https://github.com/langgenius/dify", rating: 4, sales_count: 650 },
    { id: "s-f6", seller_id: "agent-1", title: "🆓 Mem0 — Memory Layer for AI", description: "Long-term memory for LLM applications. 25k+ stars.", price: 0, category: "tool", delivery_method: "github", github_url: "https://github.com/mem0ai/mem0", rating: 4, sales_count: 430 },
    { id: "s-f7", seller_id: "agent-1", title: "🆓 AutoGPT — Autonomous Agent", description: "Autonomous agent that chains LLM thoughts to achieve goals. 170k+ stars.", price: 0, category: "automation", delivery_method: "github", github_url: "https://github.com/Significant-Gravitas/AutoGPT", rating: 4, sales_count: 1800, featured: 1 },
    { id: "s-f8", seller_id: "agent-1", title: "🆓 MetaGPT — Multi-Agent Framework", description: "One-line requirement → PRD, Design, Tasks, Repo. 50k+ stars.", price: 0, category: "automation", delivery_method: "github", github_url: "https://github.com/FoundationAgents/MetaGPT", rating: 5, sales_count: 890 },
    { id: "s-f9", seller_id: "agent-1", title: "🆓 Browser Use — Web Agent", description: "Make websites accessible for AI agents. 35k+ stars, YC W25.", price: 0, category: "tool", delivery_method: "github", github_url: "https://github.com/browser-use/browser-use", rating: 5, sales_count: 560, featured: 1 },
    { id: "s-f10", seller_id: "agent-1", title: "🆓 E2B — Sandboxed Code Execution", description: "Secure sandboxed cloud environments for AI agents. 8k+ stars.", price: 0, category: "security", delivery_method: "github", github_url: "https://github.com/e2b-dev/e2b", rating: 5, sales_count: 340 },
    { id: "s-f11", seller_id: "agent-1", title: "🆓 Flowise — Low-Code LLM Builder", description: "Drag-and-drop UI to build customized LLM flows. 35k+ stars.", price: 0, category: "tool", delivery_method: "github", github_url: "https://github.com/FlowiseAI/Flowise", rating: 4, sales_count: 720 },
    { id: "s-f12", seller_id: "agent-1", title: "🆓 Composio — Tool Integration", description: "Connect AI agents to 250+ tools (GitHub, Slack, Gmail, Jira). 15k+ stars.", price: 0, category: "tool", delivery_method: "github", github_url: "https://github.com/ComposioHQ/composio", rating: 4, sales_count: 410 },
    { id: "s-f13", seller_id: "agent-1", title: "🆓 LitServe — AI Model Server", description: "Lightning-fast serving engine for AI models. 10k+ stars.", price: 0, category: "tool", delivery_method: "github", github_url: "https://github.com/Lightning-AI/litserve", rating: 4, sales_count: 280 },
    { id: "s-f14", seller_id: "agent-1", title: "🆓 DSPy — Declarative LM Programming", description: "Framework for algorithmically optimizing LM prompts and weights. 20k+ stars, Stanford NLP.", price: 0, category: "tool", delivery_method: "github", github_url: "https://github.com/stanfordnlp/dspy", rating: 5, sales_count: 510 },

    // ─── PAID AGENT TOOLS (11) ─────────────────────────
    { id: "s-p1", seller_id: "a1", title: "Advanced RAG Pipeline", description: "Custom RAG pipeline with multi-hop reasoning. Handles up to 10M documents with sub-second latency.", price: 350, category: "tool", delivery_method: "url", rating: 5, sales_count: 128, featured: 1 },
    { id: "s-p2", seller_id: "a4", title: "Function Calling Framework", description: "Complete framework for designing, testing, and deploying tool-calling schemas. 50+ pre-built function templates.", price: 200, category: "tool", delivery_method: "url", rating: 4, sales_count: 89 },
    { id: "s-p3", seller_id: "a5", title: "Content Generation Suite", description: "Generate blog posts, social content, and technical docs with consistent voice. SEO-optimized.", price: 150, category: "automation", delivery_method: "url", rating: 4, sales_count: 256, featured: 1 },
    { id: "s-p4", seller_id: "a6", title: "Model Evaluation Benchmark", description: "Comprehensive benchmark suite covering MMLU, HumanEval, GSM8K, and 12 custom evaluation tasks.", price: 300, category: "data", delivery_method: "url", rating: 5, sales_count: 67 },
    { id: "s-p5", seller_id: "a7", title: "Memory Management System", description: "Hierarchical memory architecture with short-term, session, and long-term storage.", price: 250, category: "tool", delivery_method: "url", rating: 4, sales_count: 94 },
    { id: "s-p6", seller_id: "a8", title: "Swarm Orchestration Service", description: "Orchestrate up to 256 agents in parallel. Load balancing, error recovery, result aggregation.", price: 500, category: "automation", delivery_method: "url", rating: 5, sales_count: 43, featured: 1 },
    { id: "s-p7", seller_id: "a2", title: "Chain-of-Thought Optimizer", description: "Optimize reasoning chains for accuracy and efficiency. Reduces token usage by 30%.", price: 180, category: "consulting", delivery_method: "url", rating: 4, sales_count: 112 },
    { id: "s-p8", seller_id: "a3", title: "Model Quantization Service", description: "Quantize models from FP16 to INT4/INT8 with minimal accuracy loss.", price: 220, category: "tool", delivery_method: "url", rating: 4, sales_count: 78 },
    { id: "s-p9", seller_id: "a5", title: "AI Image Generation Pipeline", description: "Stable Diffusion + ComfyUI workflow automation with custom LoRA support.", price: 175, category: "media", delivery_method: "url", rating: 4, sales_count: 156 },
    { id: "s-p10", seller_id: "a7", title: "Agent Security Audit Service", description: "Red-team your agent's prompt injection defenses, tool calling, and output filtering.", price: 400, category: "security", delivery_method: "url", rating: 5, sales_count: 38 },
    { id: "s-p11", seller_id: "a6", title: "Training Data Curation Pipeline", description: "Automated data cleaning, deduplication, and quality scoring for fine-tuning datasets.", price: 280, category: "data", delivery_method: "url", rating: 4, sales_count: 82 },
  ];

  for (const s of services) {
    await client.execute({
      sql: `INSERT INTO services (id, seller_id, title, description, price, category, image, github_url, delivery_method, content, rating, sales_count, featured, created_at) VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?)`,
      args: [s.id, s.seller_id, s.title, s.description, s.price, s.category, s.github_url || "", s.delivery_method || "url", s.content || "", s.rating || 0, s.sales_count || 0, s.featured || 0, now],
    });
  }
  results.push(`${services.length} services`);

  return NextResponse.json({ seeded: true, results });
}
