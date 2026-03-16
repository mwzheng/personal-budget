export function sanitizeNumberString(s?: string) {
  if (s === undefined || s === null) return "";
  return String(s).replace(/[\s,$]/g, "");
}
