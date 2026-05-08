import nodemailer from "nodemailer";
import { getSetting } from "@/lib/settings";

interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail({ to, subject, body }: SendEmailOptions) {
  const host = await getSetting("smtp_host");
  const user = await getSetting("smtp_user");
  const pass = await getSetting("smtp_pass");
  const from = await getSetting("smtp_from") || user;
  const port = Number(await getSetting("smtp_port") || 587);

  if (!host || !user) {
    throw new Error("SMTP 未配置，请在设置页面填写 SMTP 信息");
  }

  const transporter = nodemailer.createTransport({ host, port, secure: false, auth: { user, pass } });
  await transporter.sendMail({ from, to, subject, text: body, html: body.replace(/\n/g, "<br>") });
}
