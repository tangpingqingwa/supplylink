import { prisma } from "@/lib/db/prisma";
import { renderTemplate } from "@/lib/template";
import { sendEmail } from "@/lib/senders/email";
import { sendWhatsApp } from "@/lib/senders/whatsapp";

export async function executeInquirySend(inquiryId: string) {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      template: true,
      items: {
        where: { status: "PENDING" },
        include: { supplier: { include: { channels: true } } },
      },
    },
  });

  if (!inquiry) throw new Error("Inquiry not found: " + inquiryId);

  const settingRows = await prisma.setting.findMany({
    where: { key: { in: ["email_enabled", "whatsapp_enabled"] } },
  });
  const settings = Object.fromEntries(
    settingRows.map((r: { key: string; value: string }) => [r.key, r.value])
  );
  const emailEnabled    = settings.email_enabled    !== "0";
  const whatsappEnabled = settings.whatsapp_enabled !== "0";

  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { status: "SENDING", sentAt: new Date() },
  });

  // Channels that require manual sending (no API automation)
  const MANUAL_CHANNELS = ["ALI1688", "FORM", "WECHAT", "SMS"];

  const variables = inquiry.variables as Record<string, string>;
  const results = { sent: 0, failed: 0, ignored: 0 };

  for (const item of inquiry.items) {
    // Manual channels: mark IGNORED (not a failure — user handles it in the detail page)
    if (MANUAL_CHANNELS.includes(item.channel)) {
      await prisma.inquiryItem.update({ where: { id: item.id }, data: { status: "IGNORED" } });
      results.ignored++;
      continue;
    }

    if (item.channel === "EMAIL" && !emailEnabled) {
      await prisma.inquiryItem.update({ where: { id: item.id }, data: { status: "FAILED", errorMsg: "邮件渠道已禁用" } });
      results.failed++;
      continue;
    }
    if (item.channel === "WHATSAPP" && !whatsappEnabled) {
      await prisma.inquiryItem.update({ where: { id: item.id }, data: { status: "FAILED", errorMsg: "WhatsApp 渠道已禁用" } });
      results.failed++;
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (item.supplier as any).channels.find(
      (c: { type: string }) => c.type === item.channel
    );
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
      await prisma.inquiryItem.update({ where: { id: item.id }, data: { status: "SENT", sentAt: new Date() } });
      results.sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      await prisma.inquiryItem.update({ where: { id: item.id }, data: { status: "FAILED", errorMsg: msg } });
      results.failed++;
    }
  }

  const finalStatus = results.failed === 0 ? "SENT" : "PARTIAL";
  await prisma.inquiry.update({ where: { id: inquiryId }, data: { status: finalStatus } });

  return { ...results, total: inquiry.items.length, manual: results.ignored };
}
