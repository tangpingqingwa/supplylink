import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      template: { select: { id: true, name: true, body: true } },
      items: {
        include: {
          supplier: { select: { id: true, name: true, company: true, channels: { select: { type: true, value: true } } } },
          response: {
            select: { id: true, unitPrice: true, currency: true, moq: true, leadTimeDays: true, rawContent: true, notes: true, receivedAt: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!inquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(inquiry);
}
