import { describe, it, expect } from "vitest";
import { buildWinbackMessage } from "./campaign";

describe("buildWinbackMessage", () => {
  it("includes the name when known", () => {
    expect(buildWinbackMessage("Jean")).toMatch(/^Jean,/);
  });

  it("still produces a valid message without a name", () => {
    const message = buildWinbackMessage(null);
    expect(message.length).toBeGreaterThan(0);
    expect(message.startsWith(",")).toBe(false);
  });
});
