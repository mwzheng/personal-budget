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
import { useEffect, useMemo, useState } from "react";

import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import {
  ComparisonSummaryCards,
  TagsComparison,
  type ComparisonMetric,
} from "@/components/charts/ComparisonDetails";
import {
  buildYearComparison,
  getDefaultComparisonYears,
} from "@/lib/utils/aggregations";
import { CATEGORY_HEX_COLORS } from "@/lib/utils/categoryColors";
import type { Transaction } from "@/lib/types/types";

function YearSelector({
  label,
  value,
  years,
  onChange,
}: {
  label: string;
  value: number;
  years: number[];
  onChange: (year: number) => void;
}) {
  return (
    <FormControl
      size="small"
      sx={{ width: { xs: "100%", sm: 180 }, maxWidth: { xs: 320, sm: "none" } }}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {years.map((year) => (
          <MenuItem key={year} value={year}>
            {year}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function YearComparisonModal({
  open,
  transactions,
  onClose,
}: {
  open: boolean;
  transactions: Transaction[];
  onClose: () => void;
}) {
  const years = useMemo(
    () =>
      Array.from(
        new Set(
          transactions.map((transaction) =>
            Number(transaction.date.substring(0, 4)),
          ),
        ),
      ).sort((a, b) => a - b),
    [transactions],
  );
  const [previousYear, setPreviousYear] = useState(
    () => getDefaultComparisonYears(transactions)[0],
  );
  const [currentYear, setCurrentYear] = useState(
    () => getDefaultComparisonYears(transactions)[1],
  );
  useEffect(() => {
    if (open) {
      const [previous, current] = getDefaultComparisonYears(transactions);
      setPreviousYear(previous);
      setCurrentYear(current);
    }
  }, [open, transactions]);
  const comparison = useMemo(
    () => buildYearComparison(transactions, previousYear, currentYear),
    [transactions, previousYear, currentYear],
  );
  const metrics: ComparisonMetric[] = [
    {
      key: "income",
      label: "Income",
      previous: comparison.previousYear.incomeAmount,
      current: comparison.currentYear.incomeAmount,
      change: comparison.changes.incomeAmount,
      color: "#26a69a",
      positiveIsFavorable: true,
    },
    {
      key: "spending",
      label: "Spending",
      previous: comparison.previousYear.spendingAmount,
      current: comparison.currentYear.spendingAmount,
      change: comparison.changes.spendingAmount,
    },
    {
      key: "savings",
      label: "Savings",
      previous: comparison.previousYear.savingsAmount,
      current: comparison.currentYear.savingsAmount,
      change: comparison.changes.savingsAmount,
      color: "#15803D",
      positiveIsFavorable: true,
    },
    {
      key: "rate",
      label: "Savings Rate",
      previous: comparison.previousYear.savingsRate ?? 0,
      current: comparison.currentYear.savingsRate ?? 0,
      previousDisplay:
        comparison.previousYear.savingsRate === null ? "—" : undefined,
      currentDisplay:
        comparison.currentYear.savingsRate === null ? "—" : undefined,
      change: comparison.changes.savingsRate,
      formatter: (value) => `${value.toFixed(1)}%`,
      positiveIsFavorable: true,
      changeSuffix: " pp",
    },
    {
      key: "average",
      label: "Avg. Monthly Spending",
      previous: comparison.previousYear.averageMonthlySpending,
      current: comparison.currentYear.averageMonthlySpending,
      change: comparison.changes.averageMonthlySpending,
    },
    {
      key: "transactions",
      label: "Transactions",
      previous: comparison.previousYear.transactionCount,
      current: comparison.currentYear.transactionCount,
      change: comparison.changes.transactionCount,
      formatter: String,
    },
    {
      key: "need",
      label: "Needs",
      previous: comparison.previousYear.totalByCategoryType.Need,
      current: comparison.currentYear.totalByCategoryType.Need,
      change: comparison.changes.Need,
      color: CATEGORY_HEX_COLORS.Need,
    },
    {
      key: "want",
      label: "Wants",
      previous: comparison.previousYear.totalByCategoryType.Want,
      current: comparison.currentYear.totalByCategoryType.Want,
      change: comparison.changes.Want,
      color: CATEGORY_HEX_COLORS.Want,
    },
    {
      key: "saving",
      label: "Savings Category",
      previous: comparison.previousYear.totalByCategoryType.Saving,
      current: comparison.currentYear.totalByCategoryType.Saving,
      change: comparison.changes.Saving,
      color: CATEGORY_HEX_COLORS.Saving,
      positiveIsFavorable: true,
    },
  ];
  const scopeText =
    comparison.scope === "year-to-date"
      ? `Year-to-date: Jan 1–${comparison.currentYear.endDate} (matched in both years)`
      : "Full calendar years: Jan 1–Dec 31";
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="year-comparison-title"
    >
      <DialogTitle
        id="year-comparison-title"
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
          Yearly Comparison
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
            mb: 1.5,
          }}
        >
          <YearSelector
            label="Previous Year"
            value={previousYear}
            years={years}
            onChange={setPreviousYear}
          />
          <Typography variant="body2" color="text.secondary">
            vs
          </Typography>
          <YearSelector
            label="Current Year"
            value={currentYear}
            years={years}
            onChange={setCurrentYear}
          />
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 3 }}
        >
          {scopeText}
        </Typography>
        <ComparisonSummaryCards
          metrics={metrics}
          previousLabel="Previous Year"
          currentLabel="Current Year"
        />
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Expense Category Comparison
            </Typography>
            <ComparisonBarChart
              prevMonth={comparison.previousYear}
              currMonth={comparison.currentYear}
              emptyMessage="No category data for the selected years"
            />
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent sx={{ p: 2 }}>
            <TagsComparison
              previous={comparison.previousYear}
              current={comparison.currentYear}
              previousLabel="Previous Year"
              currentLabel="Current Year"
            />
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
