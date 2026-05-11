import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { renderTemplate } from "@/lib/template";
import { sendEmail } from "@/lib/senders/email";
import { sendWhatsApp } from "@/lib/senders/whatsapp";
import { requireAuth } from "@/lib/api-auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      template: true,
      items: {
        where: { status: "PENDING" },
        include: { supplier: { include: { channels: true } } },
      },
    },
  });

  if (!inquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.inquiry.update({ where: { id }, data: { status: "SENDING", sentAt: new Date() } });

  const variables = inquiry.variables as Record<string, string>;
  const results = { sent: 0, failed: 0 };

  for (const item of inquiry.items) {
    const channel = item.supplier.channels.find((c: { type: string }) => c.type === item.channel);
    if (!channel) {
      await prisma.inquiryItem.update({ where: { id: item.id }, data: { status: "FAILED", errorMsg: "渠道联系方式未配置" } });
      results.failed++;
      continue;
    }

    const subject = renderTemplate(inquiry.template.subject ?? "询盘", variables);
    const body    = renderTemplate(inquiry.template.body, variables);

    try {
      if (item.channel === "EMAIL") {
        await sendEmail({ to: channel.value, subject, body });
      } else if (item.channel === "WHATSAPP") {
        await sendWhatsApp({ to: channel.value, body: `${subject}\n\n${body}` });
      }
      // ALI1688 / FORM: 标记为需手动处理
      await prisma.inquiryItem.update({ where: { id: item.id }, data: { status: "SENT", sentAt: new Date() } });
      results.sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      await prisma.inquiryItem.update({ where: { id: item.id }, data: { status: "FAILED", errorMsg: msg } });
      results.failed++;
    }
  }

  const finalStatus = results.failed === 0 ? "SENT" : results.sent === 0 ? "PARTIAL" : "PARTIAL";
  await prisma.inquiry.update({ where: { id }, data: { status: finalStatus } });

  return NextResponse.json({ ...results, total: inquiry.items.length });
}
