"use client";

import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import {
  ComparisonSummaryCards,
  TagsComparison,
  type ComparisonMetric,
} from "@/components/charts/ComparisonDetails";
import {
  buildMonthComparison,
  getAvailableMonths,
  getDefaultComparisonMonths,
} from "@/lib/utils/aggregations";
import { CATEGORY_HEX_COLORS } from "@/lib/utils/categoryColors";
import type { Transaction } from "@/lib/types/types";

function formatMonthLabel(period: string) {
  try {
    return format(parseISO(`${period}-01`), "MMMM yyyy");
  } catch {
    return period;
  }
}
function MonthSelector({
  label,
  value,
  months,
  onChange,
}: {
  label: string;
  value: string;
  months: string[];
  onChange: (period: string) => void;
}) {
  return (
    <FormControl
      size="small"
      sx={{ width: { xs: "100%", sm: 220 }, maxWidth: { xs: 320, sm: "none" } }}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(event) => onChange(event.target.value)}
      >
        {months.map((month) => (
          <MenuItem key={month} value={month}>
            {formatMonthLabel(month)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function MonthComparisonModal({
  open,
  transactions,
  onClose,
}: {
  open: boolean;
  transactions: Transaction[];
  onClose: () => void;
}) {
  const months = useMemo(
    () => getAvailableMonths(transactions),
    [transactions],
  );
  const [previousMonth, setPreviousMonth] = useState(
    () => getDefaultComparisonMonths(transactions)[0],
  );
  const [currentMonth, setCurrentMonth] = useState(
    () => getDefaultComparisonMonths(transactions)[1],
  );
  useEffect(() => {
    if (open) {
      const [previous, current] = getDefaultComparisonMonths(transactions);
      setPreviousMonth(previous);
      setCurrentMonth(current);
    }
  }, [open, transactions]);
  const comparison = useMemo(
    () => buildMonthComparison(transactions, previousMonth, currentMonth),
    [transactions, previousMonth, currentMonth],
  );
  const metrics: ComparisonMetric[] = [
    {
      key: "total",
      label: "Total Activity",
      previous: comparison.prevMonth.totalAmount,
      current: comparison.currMonth.totalAmount,
      change: comparison.changes.totalAmount,
    },
    {
      key: "income",
      label: "Income",
      previous: comparison.prevMonth.incomeAmount,
      current: comparison.currMonth.incomeAmount,
      change: comparison.changes.incomeAmount,
      color: "#26a69a",
      positiveIsFavorable: true,
    },
    {
      key: "spending",
      label: "Spending",
      previous: comparison.prevMonth.spendingAmount,
      current: comparison.currMonth.spendingAmount,
      change: comparison.changes.spendingAmount,
    },
    {
      key: "need",
      label: "Needs",
      previous: comparison.prevMonth.totalByCategoryType.Need,
      current: comparison.currMonth.totalByCategoryType.Need,
      change: comparison.changes.Need,
      color: CATEGORY_HEX_COLORS.Need,
    },
    {
      key: "want",
      label: "Wants",
      previous: comparison.prevMonth.totalByCategoryType.Want,
      current: comparison.currMonth.totalByCategoryType.Want,
      change: comparison.changes.Want,
      color: CATEGORY_HEX_COLORS.Want,
    },
    {
      key: "saving",
      label: "Savings",
      previous: comparison.prevMonth.totalByCategoryType.Saving,
      current: comparison.currMonth.totalByCategoryType.Saving,
      change: comparison.changes.Saving,
      color: CATEGORY_HEX_COLORS.Saving,
      positiveIsFavorable: true,
    },
    {
      key: "transactions",
      label: "Transactions",
      previous: comparison.prevMonth.transactionCount,
      current: comparison.currMonth.transactionCount,
      change: comparison.changes.transactionCount,
      formatter: String,
    },
  ];
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="month-comparison-title"
    >
      <DialogTitle
        id="month-comparison-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Typography
          variant="h6"
          fontWeight={700}
          component="span"
          sx={{ margin: "auto" }}
        >
          Monthly Comparison
        </Typography>
        <IconButton
          aria-label="Close comparison"
          onClick={onClose}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5, px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "center",
            alignItems: "center",
            gap: { xs: 1.5, sm: 3 },
            mb: 3,
          }}
        >
          <MonthSelector
            label="Previous Month"
            value={previousMonth}
            months={months}
            onChange={setPreviousMonth}
          />
          <Typography variant="body2" color="text.secondary">
            vs
          </Typography>
          <MonthSelector
            label="Current Month"
            value={currentMonth}
            months={months}
            onChange={setCurrentMonth}
          />
        </Box>
        <ComparisonSummaryCards
          metrics={metrics}
          previousLabel="Previous Month"
          currentLabel="Current Month"
        />
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Expense Category Comparison
            </Typography>
            <ComparisonBarChart
              prevMonth={comparison.prevMonth}
              currMonth={comparison.currMonth}
            />
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent sx={{ p: 2 }}>
            <TagsComparison
              previous={comparison.prevMonth}
              current={comparison.currMonth}
              previousLabel="Previous Month"
              currentLabel="Current Month"
            />
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
