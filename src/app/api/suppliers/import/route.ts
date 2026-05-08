import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ChannelType } from "@prisma/client";

const ChannelSchema = z.object({
  type:    z.enum(["EMAIL", "WHATSAPP", "ALI1688", "FORM"]),
  value:   z.string().min(1),
  primary: z.boolean().default(false),
});

const SupplierSchema = z.object({
  name:     z.string().min(1).max(100),
  company:  z.string().max(100).optional(),
  country:  z.string().max(80).optional(),
  notes:    z.string().max(500).optional(),
  channels: z.array(ChannelSchema).max(10).default([]),
});

const BodySchema = z.object({
  suppliers: z.array(SupplierSchema).min(1).max(200),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { suppliers } = parsed.data;
  let imported = 0;
  let failed = 0;

  await Promise.allSettled(
    suppliers.map(async s => {
      try {
        await prisma.supplier.create({
          data: {
            name:    s.name,
            company: s.company,
            country: s.country,
            notes:   s.notes,
            channels: s.channels.length ? {
              create: s.channels.map(ch => ({
                type:    ch.type as ChannelType,
                value:   ch.value,
                primary: ch.primary,
              })),
            } : undefined,
          },
        });
        imported++;
      } catch {
        failed++;
      }
    })
  );

  return NextResponse.json({ imported, failed, total: suppliers.length });
}
