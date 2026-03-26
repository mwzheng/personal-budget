import { describe, it, expect } from "vitest";
import { generateId, randomString } from "@/lib/utils/generateId";

describe("generateId", () => {
  it("returns a string in UUID format when called without a prefix", () => {
    const id = generateId();
    // crypto.randomUUID() produces the standard 8-4-4-4-12 hex pattern
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("prepends prefix with a dash separator when prefix is supplied", () => {
    const id = generateId("demo-tx");
    // Format is "<prefix>-<uuid>"
    expect(id).toMatch(/^demo-tx-[0-9a-f]{8}-/i);
  });

  it("returns unique values on repeated calls", () => {
    const ids = Array.from({ length: 20 }, () => generateId());
    const unique = new Set(ids);
    expect(unique.size).toBe(20);
  });
});

describe("randomString", () => {
  it("returns an alphanumeric string of the requested length", () => {
    const result = randomString(16);
    expect(result).toHaveLength(16);
    expect(result).toMatch(/^[0-9a-z]{16}$/);
  });

  it("uses a default length of 64 when no argument is provided", () => {
    const result = randomString();
    expect(result).toHaveLength(64);
  });

  it("returns unique values on repeated calls", () => {
    const results = new Set(Array.from({ length: 10 }, () => randomString(32)));
    expect(results.size).toBe(10);
  });
});
