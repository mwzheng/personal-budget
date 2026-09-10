export const REPORT_AMOUNT_MIN = 0;
export const REPORT_AMOUNT_MAX = 999_999;

export interface ReportAmountRange {
  minAmount: number;
  maxAmount: number;
}

export type ReportAmountPreset = {
  value: string;
  label: string;
  range: ReportAmountRange;
};

export type ReportAmountInputErrors = {
  minAmount?: string;
  maxAmount?: string;
};

export type ReportAmountDraftResult =
  | { range: ReportAmountRange; errors: ReportAmountInputErrors }
  | { range: null; errors: ReportAmountInputErrors };

export const DEFAULT_REPORT_AMOUNT_RANGE: ReportAmountRange = {
  minAmount: REPORT_AMOUNT_MIN,
  maxAmount: REPORT_AMOUNT_MAX,
};

export const REPORT_AMOUNT_PRESETS: ReportAmountPreset[] = [
  {
    value: "any",
    label: "Any Amount",
    range: DEFAULT_REPORT_AMOUNT_RANGE,
  },
  {
    value: "up-to-50",
    label: "Up to $50",
    range: { minAmount: 0, maxAmount: 50 },
  },
  {
    value: "up-to-100",
    label: "Up to $100",
    range: { minAmount: 0, maxAmount: 100 },
  },
  {
    value: "500-plus",
    label: "$500+",
    range: { minAmount: 500, maxAmount: REPORT_AMOUNT_MAX },
  },
  {
    value: "1000-plus",
    label: "$1,000+",
    range: { minAmount: 1_000, maxAmount: REPORT_AMOUNT_MAX },
  },
];

export function formatReportAmount(amount: number) {
  return `$${amount.toLocaleString()}`;
}

export function isSameReportAmountRange(
  left: ReportAmountRange,
  right: ReportAmountRange,
) {
  return (
    left.minAmount === right.minAmount && left.maxAmount === right.maxAmount
  );
}

export function isReportAmount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= REPORT_AMOUNT_MIN &&
    value <= REPORT_AMOUNT_MAX
  );
}

export function isValidReportAmountRange(
  minAmount: unknown,
  maxAmount: unknown,
): minAmount is number {
  return (
    isReportAmount(minAmount) &&
    isReportAmount(maxAmount) &&
    minAmount <= maxAmount
  );
}

/** Validates the editable amount fields before an advanced-filter apply. */
export function parseReportAmountDraft(
  minAmountInput: string,
  maxAmountInput: string,
): ReportAmountDraftResult {
  const errors: ReportAmountInputErrors = {};
  const parseWholeAmount = (
    value: string,
    field: "minAmount" | "maxAmount",
  ) => {
    if (!/^\d+$/.test(value)) {
      errors[field] = "Use a whole-dollar amount";
      return null;
    }
    const amount = Number(value);
    if (!isReportAmount(amount)) {
      errors[field] =
        `Use an amount from $0 to ${formatReportAmount(REPORT_AMOUNT_MAX)}`;
      return null;
    }
    return amount;
  };

  const minAmount = parseWholeAmount(minAmountInput.trim(), "minAmount");
  const maxRaw = maxAmountInput.trim();
  const maxAmount = maxRaw
    ? parseWholeAmount(maxRaw, "maxAmount")
    : REPORT_AMOUNT_MAX;

  if (minAmount !== null && maxAmount !== null && minAmount > maxAmount) {
    errors.maxAmount = "Maximum must be at least the minimum";
  }

  if (
    Object.keys(errors).length > 0 ||
    minAmount === null ||
    maxAmount === null
  ) {
    return { range: null, errors };
  }

  return { range: { minAmount, maxAmount }, errors };
}

/** Parses optional public API parameters into a complete, safe range. */
export function parseReportAmountRange(
  params: URLSearchParams,
): ReportAmountRange {
  const parse = (name: "minAmount" | "maxAmount", fallback: number) => {
    const raw = params.get(name);
    if (raw === null) return fallback;
    if (!/^\d+$/.test(raw)) throw new InvalidReportAmountRangeError();
    const value = Number(raw);
    if (!isReportAmount(value)) throw new InvalidReportAmountRangeError();
    return value;
  };

  const minAmount = parse("minAmount", REPORT_AMOUNT_MIN);
  const maxAmount = parse("maxAmount", REPORT_AMOUNT_MAX);
  if (minAmount > maxAmount) throw new InvalidReportAmountRangeError();
  return { minAmount, maxAmount };
}

export class InvalidReportAmountRangeError extends Error {
  constructor() {
    super(
      `Amount must be a whole-dollar range from $0 to ${formatReportAmount(REPORT_AMOUNT_MAX)}`,
    );
  }
}
