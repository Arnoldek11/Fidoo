import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

/**
 * Reconstructs the exact public URL Twilio called, from forwarded headers.
 * Twilio signs the request against the URL it actually hit — behind
 * Vercel's proxy, req.url reflects the internal request, not the public
 * one, so signature verification would fail without this.
 */
function getPublicUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return `${proto}://${host}${req.nextUrl.pathname}${req.nextUrl.search}`;
}

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const signature = req.headers.get("x-twilio-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 401 });
  }

  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });

  const isValid = twilio.validateRequest(
    authToken,
    signature,
    getPublicUrl(req),
    params
  );

  if (!isValid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // Delivery status callback (MessageStatus: queued/sent/delivered/failed/
  // undelivered). Nothing else consumes this yet — logging is enough for
  // now, revisit if/when delivery failures need to drive app behavior.
  console.log("Twilio delivery status", {
    messageSid: params.MessageSid,
    status: params.MessageStatus,
  });

  return NextResponse.json({ ok: true });
}
