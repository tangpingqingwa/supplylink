import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name:     z.string().min(1).max(50),
  email:    z.string().email(),
  password: z.string().min(6),
});

export async function GET() {
  const count = await prisma.user.count();
  return NextResponse.json({ needsSetup: count === 0 });
}

export async function POST(req: Request) {
  const count = await prisma.user.count();
  if (count > 0) return NextResponse.json({ error: "已完成初始化" }, { status: 403 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { name, email, password } = body.data;
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({ data: { name, email, hashedPassword } });
  return NextResponse.json({ ok: true });
}
