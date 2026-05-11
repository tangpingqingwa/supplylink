import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/api-auth";

const ALLOWED_KEYS = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from",
  "twilio_account_sid", "twilio_auth_token", "twilio_whatsapp_from",
  "email_enabled", "whatsapp_enabled"];

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  const rows = await prisma.setting.findMany({
    where: { key: { in: ALLOWED_KEYS } },
  });
  const settings = Object.fromEntries(rows.map((r: { key: string; value: string }) => [r.key, r.value]));
  // Mask sensitive values
  if (settings.smtp_pass) settings.smtp_pass = "••••••••";
  if (settings.twilio_auth_token) settings.twilio_auth_token = "••••••••";
  return NextResponse.json(settings);
}

const Schema = z.record(z.string(), z.string());

export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  const body = Schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const entries = Object.entries(body.data).filter(([k]) => ALLOWED_KEYS.includes(k));

  await Promise.all(entries.map(([key, value]) =>
    prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  ));

  return NextResponse.json({ ok: true, saved: entries.length });
}
