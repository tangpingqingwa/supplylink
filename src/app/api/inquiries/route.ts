import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const CreateInquirySchema = z.object({
  name: z.string().min(1),
  templateId: z.string(),
  variables: z.record(z.string(), z.string()),
  supplierIds: z.array(z.string()).min(1),
  channels: z.array(z.enum(["EMAIL", "WHATSAPP", "ALI1688", "FORM"])).min(1),
  scheduledAt: z.string().datetime().optional(),
});

export async function GET() {
  const inquiries = await prisma.inquiry.findMany({
    include: {
      template: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(inquiries);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { supplierIds, channels, scheduledAt, ...data } = parsed.data;

  const items = supplierIds.flatMap((supplierId) =>
    channels.map((channel) => ({ supplierId, channel }))
  );

  const inquiry = await prisma.inquiry.create({
    data: {
      ...data,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      items: { create: items },
    },
    include: { items: true },
  });
  return NextResponse.json(inquiry, { status: 201 });
}
