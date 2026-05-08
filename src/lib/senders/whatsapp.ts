import { getSetting } from "@/lib/settings";

interface SendWhatsAppOptions {
  to: string;
  body: string;
}

export async function sendWhatsApp({ to, body }: SendWhatsAppOptions) {
  const accountSid = await getSetting("twilio_account_sid");
  const authToken  = await getSetting("twilio_auth_token");
  const from       = await getSetting("twilio_whatsapp_from");

  if (!accountSid || !authToken) {
    throw new Error("Twilio 未配置，请在设置页面填写 Twilio 信息");
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(accountSid, authToken);

  const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const fromNumber = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  await client.messages.create({ from: fromNumber, to: toNumber, body });
}
