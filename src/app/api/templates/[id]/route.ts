import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  language: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(1).optional(),
  channels: z.array(z.enum(["EMAIL", "WHATSAPP", "ALI1688", "FORM"])).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const template = await prisma.template.update({ where: { id }, data: parsed.data });
  return NextResponse.json(template);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.template.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
