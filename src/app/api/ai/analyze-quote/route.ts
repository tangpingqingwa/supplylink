import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const Schema = z.object({
  rawContent: z.string().min(1).max(8000),
});

const SYSTEM_PROMPT = `你是一个采购报价解析助手。从供应商回复文本中提取以下字段：
- unitPrice: 单件价格（数字，无货币符号）
- currency: 货币代码（CNY/USD/EUR/HKD，默认 CNY）
- moq: 最小起订量（整数，单位 pcs）
- leadTimeDays: 交期天数（整数）
- notes: 其他重要信息（认证、付款条件、运输方式等，简短中文，100字以内）

以 JSON 格式返回，无法确定的字段省略，不要包含任何其他文字或 markdown。
示例：{"unitPrice":8.5,"currency":"USD","moq":3000,"leadTimeDays":25,"notes":"T/T 30% 定金，FOB 深圳"}`;

export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "未配置 ANTHROPIC_API_KEY" }, { status: 503 });

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: parsed.data.rawContent }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    let extracted: Record<string, unknown> = {};
    try {
      // Strip potential markdown code fences if Claude wraps the JSON
      const jsonStr = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
      extracted = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: "AI 返回格式异常，请重试" }, { status: 502 });
    }

    return NextResponse.json({
      unitPrice:    typeof extracted.unitPrice    === "number" ? extracted.unitPrice    : undefined,
      currency:     typeof extracted.currency     === "string" ? extracted.currency     : undefined,
      moq:          typeof extracted.moq          === "number" ? Math.round(extracted.moq as number) : undefined,
      leadTimeDays: typeof extracted.leadTimeDays === "number" ? Math.round(extracted.leadTimeDays as number) : undefined,
      notes:        typeof extracted.notes        === "string" ? extracted.notes        : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI 服务异常";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
