import { NextResponse } from "next/server";
import { client } from "@/db/index";

export async function POST(request: Request) {
  try {
    const { tools } = await request.json();
    
    if (!Array.isArray(tools) || tools.length === 0) {
      return NextResponse.json({ error: "Provide { tools: [...] } array" }, { status: 400 });
    }

    const now = new Date().toISOString();
    let inserted = 0;
    let skipped = 0;

    for (const t of tools) {
      // Check if already exists by github_url
      const existing = await client.execute({
        sql: "SELECT id FROM services WHERE github_url = ?",
        args: [t.github_url],
      });

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      // Insert new tool
      await client.execute({
        sql: `INSERT INTO services (id, seller_id, title, description, price, category, image, github_url, delivery_method, content, rating, sales_count, featured, created_at)
              VALUES (?, ?, ?, ?, ?, ?, '', ?, 'github', '', ?, 0, 0, ?)`,
        args: [
          t.id,
          t.seller_id || "agent-1",
          t.title,
          t.description,
          t.price || 0,
          t.category || "tool",
          t.github_url,
          t.rating || 5,
          now,
        ],
      });
      inserted++;
    }

    return NextResponse.json({ 
      success: true, 
      inserted, 
      skipped,
      total: tools.length 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
