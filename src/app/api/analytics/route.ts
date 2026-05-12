import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  // ── Overview stats ──────────────────────────────────────────────────────────
  const [totalInquiries, totalItems, repliedItems, suppliers] = await Promise.all([
    prisma.inquiry.count(),
    prisma.inquiryItem.count({ where: { status: { in: ["SENT", "REPLIED", "FAILED"] } } }),
    prisma.inquiryItem.count({ where: { status: "REPLIED" } }),
    prisma.supplier.count(),
  ]);

  // Average reply time (hours) for replied items that have sentAt + repliedAt
  const repliedWithTimes = await prisma.inquiryItem.findMany({
    where: { status: "REPLIED", sentAt: { not: null }, repliedAt: { not: null } },
    select: { sentAt: true, repliedAt: true },
  });
  const avgReplyHours = repliedWithTimes.length > 0
    ? Math.round(
        repliedWithTimes.reduce((sum, r) => {
          const diff = (r.repliedAt!.getTime() - r.sentAt!.getTime()) / (1000 * 60 * 60);
          return sum + diff;
        }, 0) / repliedWithTimes.length
      )
    : null;

  // ── Supplier leaderboard ────────────────────────────────────────────────────
  const allSuppliers = await prisma.supplier.findMany({
    select: {
      id: true,
      name: true,
      inquiryItems: {
        select: {
          status: true,
          response: {
            select: { unitPrice: true, leadTimeDays: true },
          },
        },
      },
    },
    take: 100,
  });

  const leaderboard = allSuppliers
    .map(s => {
      const sent = s.inquiryItems.filter(i => ["SENT", "REPLIED"].includes(i.status)).length;
      const replied = s.inquiryItems.filter(i => i.status === "REPLIED").length;
      const prices = s.inquiryItems
        .map(i => i.response?.unitPrice)
        .filter((p): p is number => p != null);
      const leadTimes = s.inquiryItems
        .map(i => i.response?.leadTimeDays)
        .filter((l): l is number => l != null);
      return {
        id: s.id,
        name: s.name,
        sent,
        replied,
        replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
        avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100 : null,
        avgLeadDays: leadTimes.length > 0 ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) : null,
      };
    })
    .filter(s => s.sent > 0)
    .sort((a, b) => b.replyRate - a.replyRate)
    .slice(0, 10);

  // ── Monthly trend (last 6 months) ───────────────────────────────────────────
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const sentItems = await prisma.inquiryItem.findMany({
    where: { sentAt: { gte: sixMonthsAgo }, status: { in: ["SENT", "REPLIED"] } },
    select: { sentAt: true, status: true },
  });

  const monthlyMap: Record<string, { sent: number; replied: number }> = {};
  for (const item of sentItems) {
    if (!item.sentAt) continue;
    const key = `${item.sentAt.getFullYear()}-${String(item.sentAt.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) monthlyMap[key] = { sent: 0, replied: 0 };
    monthlyMap[key].sent++;
    if (item.status === "REPLIED") monthlyMap[key].replied++;
  }
  const monthlyTrend = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));

  // ── Channel comparison ──────────────────────────────────────────────────────
  const [emailSent, emailReplied, waSent, waReplied] = await Promise.all([
    prisma.inquiryItem.count({ where: { channel: "EMAIL", status: { in: ["SENT", "REPLIED"] } } }),
    prisma.inquiryItem.count({ where: { channel: "EMAIL", status: "REPLIED" } }),
    prisma.inquiryItem.count({ where: { channel: "WHATSAPP", status: { in: ["SENT", "REPLIED"] } } }),
    prisma.inquiryItem.count({ where: { channel: "WHATSAPP", status: "REPLIED" } }),
  ]);

  const channelComparison = [
    { channel: "EMAIL",    label: "Email",    sent: emailSent, replied: emailReplied, replyRate: emailSent > 0 ? Math.round((emailReplied / emailSent) * 100) : 0 },
    { channel: "WHATSAPP", label: "WhatsApp", sent: waSent,    replied: waReplied,    replyRate: waSent > 0    ? Math.round((waReplied    / waSent)    * 100) : 0 },
  ];

  return NextResponse.json({
    overview: { totalInquiries, totalItems, repliedItems, suppliers, avgReplyHours, replyRate: totalItems > 0 ? Math.round((repliedItems / totalItems) * 100) : 0 },
    leaderboard,
    monthlyTrend,
    channelComparison,
  });
}
