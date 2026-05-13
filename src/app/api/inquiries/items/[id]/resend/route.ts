import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";
import { executeInquirySend } from "@/lib/inquiry-sender";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;

  const item = await prisma.inquiryItem.update({
    where: { id },
    data: { status: "PENDING", sentAt: null, errorMsg: null },
    select: { inquiryId: true },
  });

  await prisma.inquiry.update({
    where: { id: item.inquiryId },
    data: { status: "PARTIAL" },
  });

  const result = await executeInquirySend(item.inquiryId);
  return NextResponse.json(result);
}
