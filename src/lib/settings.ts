import { prisma } from "@/lib/db/prisma";

let cache: Record<string, string> | null = null;
let cacheAt = 0;
const TTL = 60_000;

export async function getSetting(key: string): Promise<string> {
  const now = Date.now();
  if (!cache || now - cacheAt > TTL) {
    const rows = await prisma.setting.findMany();
    cache = Object.fromEntries(rows.map(r => [r.key, r.value]));
    cacheAt = now;
  }
  return cache[key] ?? process.env[key.toUpperCase()] ?? "";
}
