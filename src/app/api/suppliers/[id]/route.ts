import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      channels: true,
      inquiryItems: {
        include: {
          inquiry: { select: { id: true, name: true, sentAt: true } },
          response: { select: { unitPrice: true, currency: true, moq: true, leadTimeDays: true, notes: true, receivedAt: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(supplier);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const supplier = await prisma.supplier.update({ where: { id }, data: parsed.data, include: { channels: true } });
  return NextResponse.json(supplier);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  await prisma.supplier.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
