const SYSTEM_PROMPT = `你是一个采购报价解析助手。从供应商回复文本中提取以下字段：
- unitPrice: 单件价格（数字，无货币符号）
- currency: 货币代码（CNY/USD/EUR/HKD，默认 CNY）
- moq: 最小起订量（整数，单位 pcs）
- leadTimeDays: 交期天数（整数）
- notes: 其他重要信息（认证、付款条件、运输方式等，简短中文，100字以内）

以 JSON 格式返回，无法确定的字段省略，不要包含任何其他文字或 markdown。
示例：{"unitPrice":8.5,"currency":"USD","moq":3000,"leadTimeDays":25,"notes":"T/T 30% 定金，FOB 深圳"}`;

export interface QuoteExtraction {
  unitPrice?:    number;
  currency?:     string;
  moq?:          number;
  leadTimeDays?: number;
  notes?:        string;
}

export async function analyzeQuoteText(rawContent: string): Promise<QuoteExtraction> {
  const apiKey  = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_API_BASE_URL ?? "https://sub.muxing.cfd";
  const model   = process.env.AI_MODEL ?? "gpt-5.5";

  if (!apiKey) throw new Error("未配置 AI_API_KEY");

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 256,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: rawContent },
      ],
    }),
  });

  if (!res.ok) throw new Error(`AI 服务错误: ${res.status}`);

  const json = await res.json();
  const text: string = json.choices?.[0]?.message?.content?.trim() ?? "";

  const jsonStr = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
  const extracted = JSON.parse(jsonStr) as Record<string, unknown>;

  return {
    unitPrice:    typeof extracted.unitPrice    === "number" ? extracted.unitPrice    : undefined,
    currency:     typeof extracted.currency     === "string" ? extracted.currency     : undefined,
    moq:          typeof extracted.moq          === "number" ? Math.round(extracted.moq as number)          : undefined,
    leadTimeDays: typeof extracted.leadTimeDays === "number" ? Math.round(extracted.leadTimeDays as number) : undefined,
    notes:        typeof extracted.notes        === "string" ? extracted.notes        : undefined,
  };
}
