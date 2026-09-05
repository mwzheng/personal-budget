import { describe, expect, it, vi } from "vitest";
import {
  appearanceStorageManager,
  normalizeAppearanceMode,
  resolveEffectiveAppearanceMode,
  toggleAppearanceMode,
} from "@/lib/theme/appearance-storage";
import {
  DARK_THEME_TOKENS,
  LIGHT_THEME_TOKENS,
  SERVER_THEME_TOKENS,
  schemeCssVariables,
} from "@/lib/theme/server-theme-tokens";

describe("appearance storage", () => {
  it("defaults invalid preferences to System", () => {
    for (const value of [null, undefined, "", "invalid", "system"])
      expect(normalizeAppearanceMode(value)).toBe("system");
    expect(normalizeAppearanceMode("light")).toBe("light");
    expect(normalizeAppearanceMode("dark")).toBe("dark");
  });
  it("survives browser storage denial", () => {
    const target = {
      get localStorage() {
        throw new Error("denied");
      },
    } as unknown as Window;
    const manager = appearanceStorageManager({
      key: "pb:theme-mode",
      storageWindow: target,
    });
    expect(manager.get("system")).toBe("system");
    expect(() => manager.set("dark")).not.toThrow();
  });
  it("persists choices and synchronizes other-tab changes and clearing storage", () => {
    let listener:
      | ((event: { key: string | null; newValue: string | null }) => void)
      | undefined;
    const target = {
      localStorage: { getItem: vi.fn(() => "dark"), setItem: vi.fn() },
      addEventListener: vi.fn((_, handler) => {
        listener = handler;
      }),
      removeEventListener: vi.fn(),
    };
    const manager = appearanceStorageManager({
      key: "pb:theme-mode",
      storageWindow: target as unknown as Window,
    });
    expect(manager.get("system")).toBe("dark");
    manager.set("light");
    expect(target.localStorage.setItem).toHaveBeenCalledWith(
      "pb:theme-mode",
      "light",
    );
    const handler = vi.fn();
    const unsubscribe = manager.subscribe(handler);
    listener?.({ key: "unrelated", newValue: "dark" });
    expect(handler).not.toHaveBeenCalled();
    listener?.({ key: "pb:theme-mode", newValue: "light" });
    expect(handler).toHaveBeenLastCalledWith("light");
    listener?.({ key: "pb:theme-mode", newValue: "bad" });
    expect(handler).toHaveBeenLastCalledWith("system");
    listener?.({ key: null, newValue: null });
    expect(handler).toHaveBeenLastCalledWith("system");
    unsubscribe();
    expect(target.removeEventListener).toHaveBeenCalledWith(
      "storage",
      listener,
    );
  });
});

describe("appearance mode toggle", () => {
  it("resolves explicit modes before system mode", () => {
    expect(resolveEffectiveAppearanceMode("light", "dark")).toBe("light");
    expect(resolveEffectiveAppearanceMode("dark", "light")).toBe("dark");
    expect(resolveEffectiveAppearanceMode("system", "light")).toBe("light");
    expect(resolveEffectiveAppearanceMode("system", "dark")).toBe("dark");
    expect(resolveEffectiveAppearanceMode(undefined, undefined)).toBe("light");
  });

  it("toggles to the opposite explicit mode", () => {
    expect(toggleAppearanceMode("light", "dark")).toBe("dark");
    expect(toggleAppearanceMode("dark", "light")).toBe("light");
    expect(toggleAppearanceMode("system", "light")).toBe("dark");
    expect(toggleAppearanceMode("system", "dark")).toBe("light");
  });
});

describe("appearance tokens", () => {
  it("provides every CSS variable in both schemes and concrete chart colors", () => {
    const dark = schemeCssVariables(DARK_THEME_TOKENS);
    const light = schemeCssVariables(LIGHT_THEME_TOKENS);
    expect([...dark.matchAll(/--pb-[\w-]+:/g)].map(([key]) => key)).toEqual(
      [...light.matchAll(/--pb-[\w-]+:/g)].map(([key]) => key),
    );
    expect(SERVER_THEME_TOKENS.surface.card).toBe("var(--pb-surface-card)");
    expect(DARK_THEME_TOKENS.surface.card).toMatch(/^#/);
    expect(LIGHT_THEME_TOKENS.surface.card).toBe("#FFFFFF");
    expect(light).toContain("--pb-palette-primary: #087F75;");
    expect(light).toContain("--pb-palette-primaryLight: #0A9689;");
    expect(dark).toContain("--pb-palette-primary: #36D9C5;");
  });
});
