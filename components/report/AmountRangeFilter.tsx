"use client";

import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

import {
  REPORT_AMOUNT_MAX,
  type ReportAmountInputErrors,
} from "@/lib/utils/reportAmount";

interface AmountRangeFilterProps {
  minAmountInput: string;
  maxAmountInput: string;
  errors: ReportAmountInputErrors;
  onMinAmountChange: (value: string) => void;
  onMaxAmountChange: (value: string) => void;
}

export function AmountRangeFilter({
  minAmountInput,
  maxAmountInput,
  errors,
  onMinAmountChange,
  onMaxAmountChange,
}: AmountRangeFilterProps) {
  return (
    <Box
      data-testid="report-amount-filter"
      aria-label="Amount Range"
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 1.25,
        alignItems: "center",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
      }}
    >
      <TextField
        label="Min Amount"
        size="small"
        value={minAmountInput}
        onChange={(event) => onMinAmountChange(event.target.value)}
        error={Boolean(errors.minAmount)}
        helperText={errors.minAmount}
        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
      />
      <TextField
        label="Max Amount"
        size="small"
        value={maxAmountInput}
        placeholder={REPORT_AMOUNT_MAX.toLocaleString()}
        onChange={(event) => onMaxAmountChange(event.target.value)}
        error={Boolean(errors.maxAmount)}
        helperText={errors.maxAmount}
        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
      />
    </Box>
  );
}
