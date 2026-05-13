import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";

const PatchSchema = z.object({
  winnerId: z.string().nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      template: { select: { id: true, name: true, body: true } },
      winner: { select: { id: true, name: true } },
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { winnerId } = parsed.data;
  const isClosing = winnerId !== null && winnerId !== undefined;

  const inquiry = await prisma.inquiry.update({
    where: { id },
    data: {
      winnerId: winnerId ?? null,
      closedAt: isClosing ? new Date() : null,
      ...(isClosing ? { status: "COMPLETED" } : { status: "SENT" }),
    },
    include: { winner: { select: { id: true, name: true } } },
  });

  return NextResponse.json(inquiry);
}
