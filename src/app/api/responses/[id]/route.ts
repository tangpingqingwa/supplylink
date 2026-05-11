import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";

const UpdateSchema = z.object({
  rawContent:    z.string().min(1).optional(),
  unitPrice:     z.number().optional().nullable(),
  currency:      z.string().optional(),
  moq:           z.number().int().optional().nullable(),
  leadTimeDays:  z.number().int().optional().nullable(),
  notes:         z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const response = await prisma.response.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(response);
}
