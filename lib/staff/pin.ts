import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const PIN_REGEX = /^\d{4,6}$/;
const SCRYPT_KEYLEN = 32;

export function isValidPin(pin: string): boolean {
  return PIN_REGEX.test(pin);
}

/** Salted scrypt hash, stored as "salt:hash" (both hex) — no new dependency for something this small. */
export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pin, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

/** Constant-time comparison — PINs are short enough that naive `===` would leak timing info. */
export function verifyPin(pin: string, storedHash: string): boolean {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(pin, salt, SCRYPT_KEYLEN);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
