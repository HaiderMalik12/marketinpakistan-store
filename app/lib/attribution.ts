export const SOURCE_STORAGE_KEY = "mip_src";

export function getStoredSource(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SOURCE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeSource(src: string): void {
  try {
    window.localStorage.setItem(SOURCE_STORAGE_KEY, src);
  } catch {
    // localStorage unavailable (private browsing, blocked storage) — attribution is best-effort
  }
}
