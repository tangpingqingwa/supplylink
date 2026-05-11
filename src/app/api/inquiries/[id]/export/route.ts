import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function escapeCell(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      template: { select: { name: true } },
      items: {
        include: {
          supplier: { select: { name: true, company: true, country: true } },
          response: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!inquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const STATUS_LABEL: Record<string, string> = {
    PENDING: "待发送", SENT: "已发送", FAILED: "发送失败", REPLIED: "已回复", IGNORED: "已忽略",
  };

  const headers = ["供应商", "公司", "国家", "渠道", "状态", "报价单价", "币种", "最小起订量(MOQ)", "交期(天)", "备注", "回复原文"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = inquiry.items.map((item: any) => {
    const r = item.response;
    return [
      item.supplier.name,
      item.supplier.company ?? "",
      item.supplier.country ?? "",
      item.channel === "WHATSAPP" ? "WhatsApp" : item.channel,
      STATUS_LABEL[item.status] ?? item.status,
      r?.unitPrice != null ? r.unitPrice : "",
      r?.currency ?? "",
      r?.moq != null ? r.moq : "",
      r?.leadTimeDays != null ? r.leadTimeDays : "",
      r?.notes ?? "",
      r?.rawContent ?? "",
    ].map(escapeCell).join(",");
  });

  const bom = "﻿"; // UTF-8 BOM for Excel compatibility
  const csv = bom + [headers.join(","), ...rows].join("\r\n");

  const filename = `${inquiry.name}_报价对比_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
