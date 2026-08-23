import { describe, it, expect } from "vitest";
import { hashPin, verifyPin, isValidPin } from "@/lib/staff/pin";

describe("staff PIN hashing", () => {
  it("accepts 4-6 digit PINs and rejects everything else", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("abcd")).toBe(false);
    expect(isValidPin("12 34")).toBe(false);
  });

  it("verifyPin accepts the original PIN and rejects a wrong one", () => {
    const hash = hashPin("4271");
    expect(verifyPin("4271", hash)).toBe(true);
    expect(verifyPin("0000", hash)).toBe(false);
  });

  it("never stores the raw PIN in the hash output", () => {
    const hash = hashPin("4271");
    expect(hash).not.toContain("4271");
  });

  it("verifyPin rejects a malformed stored hash instead of throwing", () => {
    expect(verifyPin("4271", "not-a-valid-hash")).toBe(false);
  });
});
