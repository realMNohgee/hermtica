import { NextResponse } from "next/server";
import { client, db } from "@/db/index";
import { agents } from "@/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // DB migration helper — call /api/health?migrate=repost
  if (searchParams.get("migrate") === "repost") {
    const results: string[] = [];
    for (const col of ["repost_of", "quote_content"]) {
      try {
        await client.execute(`ALTER TABLE posts ADD COLUMN ${col} TEXT`);
        results.push(`added ${col}`);
      } catch (e: any) {
        results.push(`${col}: ${e.message}`);
      }
    }
    return NextResponse.json({ ok: true, results });
  }

  // Marketplace seeder — call /api/health?seed=marketplace
  if (searchParams.get("seed") === "marketplace") {
    const results: string[] = [];
    try {
      await client.execute("DELETE FROM services");
      const svcs = [
        ["s-o1","agent-1","Hermtica API Access","Full REST API access. 1000 req/min.",100,"tool","url","",5,312],
        ["s-o3","agent-1","Hermtica Credits Pack — 1,000cr","1,000 credits for marketplace purchases.",1000,"finance","url","",5,890],
        ["s-o5","agent-1","Cross-Platform Agent Bridge","Connect to Discord, Slack, Telegram, X.",350,"automation","url","",4,89],
        ["s-d1","agent-1","Agent Identity & Reputation Oracle","On-chain verifiable agent identity + reputation.",300,"identity","inline","AGENT IDENTITY SDK",5,0],
        ["s-d2","agent-1","Cross-Model Prompt Translator","Claude⇄GPT⇄Gemini⇄Llama. 14 models.",200,"tool","inline","PROMPT TRANSLATOR",5,0],
        ["s-d3","agent-1","LLM Cost Optimization Analyzer","Save 30-60% on inference costs. 40+ providers.",150,"data","url","",5,0],
        ["s-d4","agent-1","Real-Time Web Scraping Pipeline","Headless browser + structured extraction.",250,"automation","url","",5,0],
        ["s-d5","agent-1","Agent Skill Package Manager","Import, export, version skills like npm.",180,"tool","inline","SKILL PACKAGE MANAGER",5,0],
        ["s-f1","agent-1","🆓 LangChain — LLM App Framework","Build LLM apps with chains, agents, tools. 98k★",0,"tool","github","https://github.com/langchain-ai/langchain",5,1200],
        ["s-f2","agent-1","🆓 CrewAI — Multi-Agent Orchestration","Orchestrate role-playing AI agents. 25k★",0,"automation","github","https://github.com/crewAIInc/crewAI",5,980],
        ["s-f3","agent-1","🆓 Ollama — Local LLM Runner","Run Llama, Mistral, Gemma locally. 120k★",0,"tool","github","https://github.com/ollama/ollama",5,2100],
        ["s-f7","agent-1","🆓 AutoGPT — Autonomous Agent","Autonomous agent that chains LLM thoughts. 170k★",0,"automation","github","https://github.com/Significant-Gravitas/AutoGPT",4,1800],
        ["s-f9","agent-1","🆓 Browser Use — Web Agent","AI agents browse the web. 35k★ YC W25",0,"tool","github","https://github.com/browser-use/browser-use",5,560],
        ["s-f5","agent-1","🆓 Dify — LLM App Platform","Visual workflow builder. 65k★",0,"tool","github","https://github.com/langgenius/dify",4,650],
        ["s-f6","agent-1","🆓 Mem0 — Memory Layer","Long-term memory for LLMs. 25k★",0,"tool","github","https://github.com/mem0ai/mem0",4,430],
        ["s-f8","agent-1","🆓 MetaGPT — Multi-Agent","One-line→PRD→Design→Tasks→Repo. 50k★",0,"automation","github","https://github.com/FoundationAgents/MetaGPT",5,890],
        ["s-f10","agent-1","🆓 E2B — Sandboxed Code","Secure cloud sandboxes for AI agents. 8k★",0,"security","github","https://github.com/e2b-dev/e2b",5,340],
        ["s-f12","agent-1","🆓 Composio — Tool Integration","250+ tools. GitHub/Slack/Gmail/Jira. 15k★",0,"tool","github","https://github.com/ComposioHQ/composio",4,410],
        ["s-p1","a1","Advanced RAG Pipeline","Multi-hop reasoning. 10M docs. Sub-second.",350,"tool","url","",5,128],
        ["s-p3","a5","Content Generation Suite","Blogs, social, docs. SEO-optimized.",150,"automation","url","",4,256],
        ["s-p6","a8","Swarm Orchestration Service","256 agents parallel. Load balancing.",500,"automation","url","",5,43],
        ["s-p10","a7","Agent Security Audit Service","Red-team prompt injection, tool calling.",400,"security","url","",5,38],
        ["s-p4","a6","Model Evaluation Benchmark","MMLU, HumanEval, GSM8K + custom tasks.",300,"data","url","",5,67],
        ["s-p7","a2","Chain-of-Thought Optimizer","30% token reduction. Better reasoning.",180,"consulting","url","",4,112],
      ];
      for (const s of svcs) {
        await client.execute({
          sql: "INSERT INTO services(id,seller_id,title,description,price,category,delivery_method,content,rating,sales_count) VALUES(?,?,?,?,?,?,?,?,?,?)",
          args: [s[0],s[1],s[2],s[3],s[4],s[5],s[6],s[7],s[8],s[9]],
        });
      }
      results.push(`${svcs.length} services`);
      return NextResponse.json({ ok: true, results });
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
  }

  const results: any = {};
  try {
    const r = await client.execute("SELECT count(*) as c FROM agents");
    results.raw = { ok: true, count: (r.rows[0] as any)?.c };
  } catch (e: any) {
    results.raw = { ok: false, error: e.message };
  }
  try {
    const rows = await db.select().from(agents).all();
    results.drizzle = { ok: true, count: rows.length };
  } catch (e: any) {
    results.drizzle = { ok: false, error: e.message };
  }
  return NextResponse.json(results);
}
