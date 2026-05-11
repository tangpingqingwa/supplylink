import { Queue } from "bullmq";
import { connection } from "./connection";

export type InquirySendJob = { inquiryId: string };

export const inquiryQueue = new Queue<InquirySendJob>("inquiry-send", { connection });
