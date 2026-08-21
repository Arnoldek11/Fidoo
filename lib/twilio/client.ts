import twilio from "twilio";

function getClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are not configured");
  }
  return twilio(accountSid, authToken);
}

export async function sendSms(to: string, body: string) {
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) {
    throw new Error("TWILIO_FROM_NUMBER is not configured");
  }

  const client = getClient();
  return client.messages.create({ to, from, body });
}
