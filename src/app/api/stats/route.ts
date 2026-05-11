import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    supplierTotal,
    supplierMonth,
    sentTotal,
    sentMonth,
    pendingReplies,
    receivedReplies,
  ] = await Promise.all([
    prisma.supplier.count(),
    prisma.supplier.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.inquiryItem.count({ where: { status: { in: ["SENT", "REPLIED"] } } }),
    prisma.inquiryItem.count({ where: { status: { in: ["SENT", "REPLIED"] }, sentAt: { gte: monthStart } } }),
    prisma.inquiryItem.count({ where: { status: "SENT" } }),
    prisma.response.count(),
  ]);

  const replyRate = sentTotal > 0 ? Math.round((receivedReplies / sentTotal) * 100) : 0;

  return NextResponse.json({
    supplierTotal,
    supplierMonth,
    sentTotal,
    sentMonth,
    pendingReplies,
    receivedReplies,
    replyRate,
  });
}
