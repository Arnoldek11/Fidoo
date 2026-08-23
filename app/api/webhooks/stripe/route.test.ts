import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const WEBHOOK_SECRET = "whsec_test_dummy_secret";

function postRequest(body: string, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
    headers,
  });
}

describe("POST /api/webhooks/stripe", () => {
  let establishmentId: string;

  beforeEach(async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);

    const a = await prisma.establishmentUser.findFirstOrThrow({
      where: { email: "cafe-a@test.fidoo.app" },
    });
    establishmentId = a.establishmentId;
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await prisma.establishment.update({
      where: { id: establishmentId },
      data: { plan: "pilote", billingStatus: null, stripeCustomerId: null, stripeSubscriptionId: null },
    });
  });

  it("rejects a request with no signature header", async () => {
    const { POST } = await import("./route");
    const res = await POST(postRequest("{}"));
    expect(res.status).toBe(401);
  });

  it("rejects a request with a signature that doesn't match the payload", async () => {
    const { POST } = await import("./route");
    const res = await POST(postRequest("{}", { "stripe-signature": "t=1,v1=not-a-real-signature" }));
    expect(res.status).toBe(401);
  });

  it("accepts a correctly signed event and applies it", async () => {
    const payload = JSON.stringify({
      id: "evt_test_001",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: establishmentId,
          customer: "cus_test_route_001",
          subscription: "sub_test_route_001",
        },
      },
    });
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: WEBHOOK_SECRET,
    });

    const { POST } = await import("./route");
    const res = await POST(postRequest(payload, { "stripe-signature": signature }));
    expect(res.status).toBe(200);

    const establishment = await prisma.establishment.findUniqueOrThrow({
      where: { id: establishmentId },
    });
    expect(establishment.plan).toBe("standard");
    expect(establishment.stripeCustomerId).toBe("cus_test_route_001");
  });
});
