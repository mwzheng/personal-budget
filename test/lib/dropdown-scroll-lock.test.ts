import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const providersSource = readFileSync(
  new URL("../../app/providers.tsx", import.meta.url),
  "utf8",
);

describe("dropdown scroll behavior", () => {
  it("keeps MUI popover menus from locking the page scroll", () => {
    expect(providersSource).toContain("MuiPopover: {");
    expect(providersSource).toContain("defaultProps: {");
    expect(providersSource).toContain("disableScrollLock: true");
  });
});
