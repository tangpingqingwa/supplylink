import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const items = await prisma.inquiryItem.findMany({
    where: { status: "SENT" },
    include: {
      supplier: { select: { id: true, name: true, company: true } },
      inquiry: { select: { name: true } },
    },
    orderBy: { sentAt: "desc" },
  });
  return NextResponse.json(items);
}
