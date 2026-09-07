const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isIsoCalendarDate(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/** Rejects malformed or reversed custom report boundaries. */
export function validateReportDateRange(params: URLSearchParams) {
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  if (
    (startDate !== null && !isIsoCalendarDate(startDate)) ||
    (endDate !== null && !isIsoCalendarDate(endDate)) ||
    (startDate !== null && endDate !== null && startDate > endDate)
  ) {
    throw new InvalidReportDateRangeError();
  }
}

/** Converts report filters into an explicit DynamoDB date boundary. */
export function resolveReportRange(params: URLSearchParams) {
  validateReportDateRange(params);
  if (params.get("allHistory") === "true") {
    return {};
  }

  const currentYear = new Date().getUTCFullYear();
  const years = (params.get("years") ?? "")
    .split(",")
    .map((year) => Number(year))
    .filter((year) => Number.isInteger(year) && year >= 1 && year <= 9999);
  const startDate =
    params.get("startDate") ??
    (years.length ? `${Math.min(...years)}-01-01` : `${currentYear}-01-01`);
  const endDate =
    params.get("endDate") ??
    (years.length ? `${Math.max(...years)}-12-31` : `${currentYear}-12-31`);
  return { startDate, endDate };
}

export function encodeCursor(cursor: Record<string, unknown> | undefined) {
  return cursor
    ? Buffer.from(JSON.stringify(cursor)).toString("base64url")
    : undefined;
}

export function decodeCursor(cursor: string | null, userId?: string) {
  if (!cursor) return undefined;
  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    );
    if (
      !decoded ||
      typeof decoded !== "object" ||
      Array.isArray(decoded) ||
      typeof decoded.pk !== "string" ||
      typeof decoded.sk !== "string" ||
      (userId !== undefined && decoded.pk !== `user#${userId}`)
    ) {
      throw new Error("Cursor must be an object");
    }
    return decoded as Record<string, unknown>;
  } catch {
    throw new InvalidCursorError();
  }
}

/** A client-input error, deliberately distinct from DynamoDB/auth failures. */
export class InvalidCursorError extends Error {
  constructor() {
    super("Invalid cursor");
  }
}

export class InvalidReportDateRangeError extends Error {
  constructor() {
    super(
      "Report dates must be valid calendar dates with the start date on or before the end date",
    );
  }
}
