import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "@/lib/db/prisma";
import { analyzeQuoteText } from "@/lib/ai-analyze";

async function getImapConfig() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["imap_host", "imap_port", "imap_user", "imap_pass", "imap_enabled"] } },
  });
  return Object.fromEntries(rows.map((r: { key: string; value: string }) => [r.key, r.value]));
}

function extractText(parsed: Awaited<ReturnType<typeof simpleParser>>): string {
  if (parsed.text) return parsed.text.trim();
  if (parsed.html) {
    return parsed.html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return "";
}

export async function pollInbox() {
  const cfg = await getImapConfig();

  if (cfg.imap_enabled === "0" || !cfg.imap_enabled) {
    console.log("[imap-poll] IMAP not enabled, skipping");
    return { processed: 0, matched: 0 };
  }
  if (!cfg.imap_host || !cfg.imap_user || !cfg.imap_pass) {
    console.log("[imap-poll] IMAP not configured, skipping");
    return { processed: 0, matched: 0 };
  }

  const client = new ImapFlow({
    host: cfg.imap_host,
    port: parseInt(cfg.imap_port ?? "993"),
    secure: parseInt(cfg.imap_port ?? "993") === 993,
    auth: { user: cfg.imap_user, pass: cfg.imap_pass },
    logger: false,
  });

  let processed = 0;
  let matched   = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Fetch all UNSEEN messages
      for await (const msg of client.fetch({ seen: false }, { envelope: true, source: true })) {
        processed++;
        const fromAddr = msg.envelope?.from?.[0]?.address?.toLowerCase();
        if (!fromAddr) continue;

        // Find matching supplier channel (case-insensitive)
        const channel = await prisma.channel.findFirst({
          where: { type: "EMAIL", value: { equals: fromAddr, mode: "insensitive" } },
          include: { supplier: true },
        });
        if (!channel) continue;

        // Find the most recent SENT InquiryItem with no response yet
        const item = await prisma.inquiryItem.findFirst({
          where: {
            supplierId: channel.supplierId,
            channel: "EMAIL",
            status: "SENT",
            response: null,
          },
          orderBy: { sentAt: "desc" },
        });
        if (!item) continue;

        // Parse email body
        if (!msg.source) continue;
        const parsed  = await simpleParser(msg.source);
        const rawContent = extractText(parsed);
        if (!rawContent) continue;

        // Create Response
        const response = await prisma.response.create({
          data: { inquiryItemId: item.id, rawContent },
        });

        // Update InquiryItem → REPLIED
        await prisma.inquiryItem.update({
          where: { id: item.id },
          data: { status: "REPLIED", repliedAt: new Date() },
        });

        matched++;
        console.log(`[imap-poll] Matched email from ${fromAddr} → inquiryItem ${item.id}`);

        // AI analysis (best-effort, don't fail the whole flow)
        if (process.env.AI_API_KEY) {
          try {
            const extraction = await analyzeQuoteText(rawContent);
            if (Object.keys(extraction).some(k => extraction[k as keyof typeof extraction] != null)) {
              await prisma.response.update({ where: { id: response.id }, data: extraction });
              console.log(`[imap-poll] AI extracted: ${JSON.stringify(extraction)}`);
            }
          } catch (aiErr) {
            console.warn("[imap-poll] AI analysis failed:", (aiErr as Error).message);
          }
        }

        // Mark email as read
        await client.messageFlagsAdd({ uid: msg.uid }, ["\\Seen"], { uid: true });
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error("[imap-poll] Error:", (err as Error).message);
    throw err;
  }

  console.log(`[imap-poll] Done: processed=${processed} matched=${matched}`);
  return { processed, matched };
}
