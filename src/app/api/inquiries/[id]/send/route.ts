import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { executeInquirySend } from "@/lib/inquiry-sender";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;

  try {
    const result = await executeInquirySend(id);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "未知错误";
    if (msg.includes("not found")) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
