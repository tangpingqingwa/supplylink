import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const CreateResponseSchema = z.object({
  inquiryItemId: z.string(),
  rawContent: z.string().min(1),
  unitPrice: z.number().optional(),
  currency: z.string().optional(),
  moq: z.number().int().optional(),
  leadTimeDays: z.number().int().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { searchParams } = new URL(req.url);
  const inquiryId = searchParams.get("inquiryId");

  const responses = await prisma.response.findMany({
    where: inquiryId ? { inquiryItem: { inquiryId } } : undefined,
    include: {
      inquiryItem: {
        include: {
          supplier: { select: { id: true, name: true, company: true } },
          inquiry: { select: { name: true } },
        },
      },
    },
    orderBy: { receivedAt: "desc" },
  });
  return NextResponse.json(responses);
}

export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  const parsed = CreateResponseSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const response = await prisma.response.create({ data: parsed.data });
  await prisma.inquiryItem.update({
    where: { id: parsed.data.inquiryItemId },
    data: { status: "REPLIED", repliedAt: new Date() },
  });
  return NextResponse.json(response, { status: 201 });
}
