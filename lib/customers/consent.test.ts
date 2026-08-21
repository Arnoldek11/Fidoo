import { describe, it, expect } from "vitest";
import { hasMarketingConsent } from "./consent";

describe("hasMarketingConsent", () => {
  it("is false when consent was never given", () => {
    expect(hasMarketingConsent({ consentGivenAt: null })).toBe(false);
  });

  it("is true once consent has a timestamp", () => {
    expect(hasMarketingConsent({ consentGivenAt: new Date() })).toBe(true);
  });
});
