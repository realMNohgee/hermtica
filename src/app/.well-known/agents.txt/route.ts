import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect("https://hermtica.com/agents.txt");
}
