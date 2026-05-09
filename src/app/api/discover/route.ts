import { NextResponse } from "next/server";
import { z } from "zod";
import { discoverSuppliers } from "@/lib/search/discover";
import { prisma } from "@/lib/db/prisma";

const Schema = z.object({
  keyword: z.string().min(1).max(100),
  region: z.enum(["CN", "GLOBAL"]).default("CN"),
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { keyword, region } = parsed.data;
  const candidates = await discoverSuppliers(keyword, region);

  // Mark which are already in supplier library (match by domain)
  const existing = await prisma.supplier.findMany({
    select: { id: true, name: true },
  });
  const existingNames = new Set(existing.map((s: { name: string }) => s.name.toLowerCase()));

  const enriched = candidates.map(c => ({
    ...c,
    imported: existingNames.has(c.name.toLowerCase()),
  }));

  return NextResponse.json({ results: enriched, total: enriched.length, keyword });
}
