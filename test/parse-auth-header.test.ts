import { describe, it, expect } from "vitest";
import { parseBearerToken } from "@/lib/auth/parseAuthHeader";

describe("parseBearerToken", () => {
  it("extracts the token from a well-formed Bearer header", () => {
    expect(parseBearerToken("Bearer abc123")).toBe("abc123");
  });

  it("is case-insensitive for the Bearer scheme prefix", () => {
    expect(parseBearerToken("bearer ABC")).toBe("ABC");
    expect(parseBearerToken("BEARER xyz")).toBe("xyz");
  });

  it("preserves the full token including dots and special chars (JWT)", () => {
    const jwt = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyMSJ9.signature";
    expect(parseBearerToken(`Bearer ${jwt}`)).toBe(jwt);
  });

  it("returns null for an empty string", () => {
    expect(parseBearerToken("")).toBeNull();
  });

  it("returns null for the wrong scheme (Basic)", () => {
    expect(parseBearerToken("Basic dXNlcjpwYXNz")).toBeNull();
  });

  it("returns null when the header is undefined", () => {
    expect(parseBearerToken(undefined)).toBeNull();
  });

  it("returns null when the header is null", () => {
    expect(parseBearerToken(null)).toBeNull();
  });

  it("returns null when there is no token after Bearer", () => {
    // "Bearer " with nothing after the space should not match
    expect(parseBearerToken("Bearer ")).toBeNull();
  });
});
