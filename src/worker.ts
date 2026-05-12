import { Worker, Queue } from "bullmq";
import { connection } from "@/lib/queue/connection";
import { executeInquirySend } from "@/lib/inquiry-sender";
import { pollInbox } from "@/lib/imap-poller";

// ── Inquiry send worker ──────────────────────────────────────────────────────
const sendWorker = new Worker<{ inquiryId: string }>(
  "inquiry-send",
  async (job) => {
    console.log(`[worker] Processing job ${job.id} for inquiry ${job.data.inquiryId}`);
    const result = await executeInquirySend(job.data.inquiryId);
    console.log(`[worker] Done: sent=${result.sent} failed=${result.failed}`);
  },
  { connection }
);

sendWorker.on("failed", (job, err) => {
  console.error(`[send-worker] Job ${job?.id} failed:`, err.message);
});

// ── IMAP poll worker (every 5 minutes) ──────────────────────────────────────
const imapWorker = new Worker(
  "imap-poll",
  async () => {
    await pollInbox();
  },
  { connection }
);

imapWorker.on("failed", (_job, err) => {
  console.error("[imap-worker] Poll failed:", err.message);
});

// Register repeatable job once on startup (BullMQ deduplicates by jobId)
const imapQueue = new Queue("imap-poll", { connection });
imapQueue.add("poll", {}, {
  repeat:  { every: 5 * 60 * 1000 },
  jobId:   "imap-poll-repeat",
}).then(() => {
  console.log("[imap-worker] Repeatable poll job registered (every 5 min)");
});

console.log("[worker] All workers started");
