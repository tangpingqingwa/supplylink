import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { analyzeQuoteText } from "@/lib/ai-analyze";

export async function POST(req: Request) {
  // Parse Twilio's application/x-www-form-urlencoded payload
  const text = await req.text();
  const params = new URLSearchParams(text);

  const rawFrom = params.get("From") ?? "";
  const body    = params.get("Body") ?? "";

  // Strip "whatsapp:" prefix
  const fromNumber = rawFrom.replace(/^whatsapp:/i, "").trim();

  if (!fromNumber || !body) {
    return new NextResponse("<Response/>", { status: 200, headers: { "Content-Type": "text/xml" } });
  }

  try {
    const channel = await prisma.channel.findFirst({
      where: { type: "WHATSAPP", value: { equals: fromNumber, mode: "insensitive" } },
      include: { supplier: true },
    });

    if (!channel) {
      console.log(`[twilio-webhook] No channel found for ${fromNumber}`);
      return new NextResponse("<Response/>", { status: 200, headers: { "Content-Type": "text/xml" } });
    }

    const item = await prisma.inquiryItem.findFirst({
      where: {
        supplierId: channel.supplierId,
        channel: "WHATSAPP",
        status: "SENT",
        response: null,
      },
      orderBy: { sentAt: "desc" },
    });

    if (!item) {
      console.log(`[twilio-webhook] No pending inquiry for supplier ${channel.supplierId}`);
      return new NextResponse("<Response/>", { status: 200, headers: { "Content-Type": "text/xml" } });
    }

    const response = await prisma.response.create({
      data: { inquiryItemId: item.id, rawContent: body },
    });

    await prisma.inquiryItem.update({
      where: { id: item.id },
      data: { status: "REPLIED", repliedAt: new Date() },
    });

    console.log(`[twilio-webhook] Matched WhatsApp from ${fromNumber} → inquiryItem ${item.id}`);

    if (process.env.AI_API_KEY) {
      try {
        const extraction = await analyzeQuoteText(body);
        if (Object.keys(extraction).some(k => extraction[k as keyof typeof extraction] != null)) {
          await prisma.response.update({ where: { id: response.id }, data: extraction });
          console.log(`[twilio-webhook] AI extracted: ${JSON.stringify(extraction)}`);
        }
      } catch (aiErr) {
        console.warn("[twilio-webhook] AI analysis failed:", (aiErr as Error).message);
      }
    }
  } catch (err) {
    console.error("[twilio-webhook] Error:", (err as Error).message);
  }

  // Always return empty TwiML so Twilio doesn't log errors
  return new NextResponse("<Response/>", { status: 200, headers: { "Content-Type": "text/xml" } });
}
