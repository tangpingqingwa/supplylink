import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const CreateSupplierSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  country: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  channels: z.array(z.object({
    type: z.enum(["EMAIL", "WHATSAPP", "ALI1688", "FORM"]),
    value: z.string().min(1),
    label: z.string().optional(),
    primary: z.boolean().optional(),
  })).optional(),
});

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  const suppliers = await prisma.supplier.findMany({
    include: { channels: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  const body = await req.json();
  const parsed = CreateSupplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { channels, ...data } = parsed.data;
  const supplier = await prisma.supplier.create({
    data: {
      ...data,
      channels: channels ? { create: channels } : undefined,
    },
    include: { channels: true },
  });
  return NextResponse.json(supplier, { status: 201 });
}
