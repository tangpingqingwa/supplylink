import { Worker } from "bullmq";
import { connection } from "@/lib/queue/connection";
import { executeInquirySend } from "@/lib/inquiry-sender";

const worker = new Worker<{ inquiryId: string }>(
  "inquiry-send",
  async (job) => {
    console.log(`[worker] Processing job ${job.id} for inquiry ${job.data.inquiryId}`);
    const result = await executeInquirySend(job.data.inquiryId);
    console.log(`[worker] Done: sent=${result.sent} failed=${result.failed}`);
  },
  { connection }
);

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
});

console.log("[worker] Inquiry send worker started");
