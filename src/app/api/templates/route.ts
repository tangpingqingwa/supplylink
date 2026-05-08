import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const ChannelTypeEnum = z.enum(["EMAIL", "WHATSAPP", "ALI1688", "FORM"]);

const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  language: z.string().default("zh"),
  subject: z.string().optional(),
  body: z.string().min(1),
  channels: z.array(ChannelTypeEnum).min(1),
});

export async function GET() {
  const templates = await prisma.template.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateTemplateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const template = await prisma.template.create({ data: parsed.data });
  return NextResponse.json(template, { status: 201 });
}
