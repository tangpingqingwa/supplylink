import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";
import { analyzeQuoteText } from "@/lib/ai-analyze";

const Schema = z.object({
  rawContent: z.string().min(1).max(8000),
});

export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (!process.env.AI_API_KEY) return NextResponse.json({ error: "未配置 AI_API_KEY" }, { status: 503 });

  try {
    const result = await analyzeQuoteText(parsed.data.rawContent);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI 服务异常";
    if (msg.includes("JSON")) return NextResponse.json({ error: "AI 返回格式异常，请重试" }, { status: 502 });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
