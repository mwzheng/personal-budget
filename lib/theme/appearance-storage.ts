import type { ThemeProviderProps } from "@mui/material/styles/ThemeProvider";

export type AppearanceMode = "light" | "dark" | "system";

/** Resolve the concrete theme currently active in the browser. */
export function resolveEffectiveAppearanceMode(
  mode: AppearanceMode | undefined,
  systemMode: Exclude<AppearanceMode, "system"> | undefined,
): Exclude<AppearanceMode, "system"> {
  // MUI leaves these values undefined during the initial render. Light is a
  // stable fallback that matches the server-rendered color scheme.
  if (mode === "dark" || (mode === "system" && systemMode === "dark")) {
    return "dark";
  }
  return "light";
}

/** Return the explicit preference needed to switch the effective theme. */
export function toggleAppearanceMode(
  mode: AppearanceMode | undefined,
  systemMode: Exclude<AppearanceMode, "system"> | undefined,
): Exclude<AppearanceMode, "system"> {
  return resolveEffectiveAppearanceMode(mode, systemMode) === "dark"
    ? "light"
    : "dark";
}

export function normalizeAppearanceMode(value: unknown): AppearanceMode {
  return value === "light" || value === "dark" ? value : "system";
}

/** Storage denial must not prevent using the app or changing this tab's mode. */
export const appearanceStorageManager: NonNullable<
  ThemeProviderProps["storageManager"]
> = ({ key, storageWindow }) => {
  const target =
    storageWindow ?? (typeof window === "undefined" ? undefined : window);
  const normalize = (value: unknown) =>
    key === "pb:theme-mode" ? normalizeAppearanceMode(value) : value;
  return {
    get(defaultValue) {
      try {
        return normalize(target?.localStorage.getItem(key) ?? defaultValue);
      } catch {
        return normalize(defaultValue);
      }
    },
    set(value) {
      try {
        target?.localStorage.setItem(key, value);
      } catch {
        /* Session-only preference. */
      }
    },
    subscribe(handler) {
      const listener = (event: StorageEvent) => {
        if (event.key === key || event.key === null)
          handler(normalize(event.newValue));
      };
      target?.addEventListener("storage", listener);
      return () => target?.removeEventListener("storage", listener);
    },
  };
};
