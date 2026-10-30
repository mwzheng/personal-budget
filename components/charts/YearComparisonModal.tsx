"use client";

import CloseIcon from "@mui/icons-material/Close";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
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
  ChangeIndicator,
  TagsComparison,
  type ComparisonMetric,
} from "@/components/charts/ComparisonDetails";
import {
  buildYearComparison,
  getDefaultComparisonYears,
} from "@/lib/utils/aggregations";
import {
  CATEGORY_HEX_COLORS,
  TRANSACTION_CATEGORY_HEX_COLORS,
} from "@/lib/utils/categoryColors";
import { formatCurrency } from "@/lib/utils/format";
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
      sx={{ flex: { xs: 1, sm: "none" }, minWidth: 0, width: { sm: 180 } }}
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
  loading,
  error,
  onRetry,
  onClose,
}: {
  open: boolean;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
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
      color: TRANSACTION_CATEGORY_HEX_COLORS.Income,
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
      color: CATEGORY_HEX_COLORS.Saving,
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
      maxWidth={false}
      fullWidth
      PaperProps={{ sx: { width: "min(1500px, calc(100% - 32px))", m: 2 } }}
      aria-labelledby="year-comparison-title"
    >
      <DialogTitle
        id="year-comparison-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700} component="span">
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
        {loading ? (
          <Box
            sx={{ py: 8, display: "flex", justifyContent: "center" }}
            aria-label="Loading yearly comparison"
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={onRetry}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : years.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>
            Add transactions to compare yearly spending.
          </Typography>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 1.5,
                mb: 1.5,
              }}
            >
              <YearSelector
                label="Compare From"
                value={previousYear}
                years={years}
                onChange={setPreviousYear}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                to
              </Typography>
              <YearSelector
                label="Compare To"
                value={currentYear}
                years={years}
                onChange={setCurrentYear}
              />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 1 }}
            >
              {scopeText}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2,
                alignItems: "start",
              }}
            >
              <Card variant="outlined">
                <CardContent
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    "&:last-child": { pb: { xs: 2, sm: 2.5 } },
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    Comparison Overview
                  </Typography>
                  <Box sx={{ overflowX: "auto" }}>
                    <Box
                      component="table"
                      sx={{
                        width: "100%",
                        minWidth: 500,
                        borderCollapse: "collapse",
                        fontVariantNumeric: "tabular-nums",
                        "& th, & td": {
                          py: 0.75,
                          px: 1,
                          borderBottom: 1,
                          borderColor: "divider",
                        },
                        "& tr:last-of-type td": { borderBottom: 0 },
                        "& th:not(:first-of-type), & td:not(:first-of-type)": {
                          textAlign: "right",
                        },
                      }}
                    >
                      <Box component="thead">
                        <Box component="tr" sx={{ color: "text.secondary" }}>
                          <Box
                            component="th"
                            scope="col"
                            sx={{
                              textAlign: "left",
                              typography: "caption",
                              fontWeight: 600,
                            }}
                          >
                            Metric
                          </Box>
                          <Box
                            component="th"
                            scope="col"
                            sx={{ typography: "caption", fontWeight: 600 }}
                          >
                            {String(previousYear)}
                          </Box>
                          <Box
                            component="th"
                            scope="col"
                            sx={{ typography: "caption", fontWeight: 600 }}
                          >
                            {String(currentYear)}
                          </Box>
                          <Box
                            component="th"
                            scope="col"
                            sx={{ typography: "caption", fontWeight: 600 }}
                          >
                            Change
                          </Box>
                        </Box>
                      </Box>
                      <Box component="tbody">
                        {metrics.map((metric) => (
                          <Box component="tr" key={metric.key}>
                            <Box
                              component="td"
                              sx={{ typography: "body2", fontWeight: 600 }}
                            >
                              {metric.label}
                            </Box>
                            <Box
                              component="td"
                              sx={{
                                typography: "body2",
                                color: "text.secondary",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {metric.previousDisplay ??
                                (metric.formatter ?? formatCurrency)(
                                  metric.previous,
                                )}
                            </Box>
                            <Box
                              component="td"
                              sx={{
                                typography: "body2",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {metric.currentDisplay ??
                                (metric.formatter ?? formatCurrency)(
                                  metric.current,
                                )}
                            </Box>
                            <Box component="td">
                              <ChangeIndicator
                                value={metric.change}
                                positiveIsFavorable={metric.positiveIsFavorable}
                                suffix={metric.changeSuffix}
                              />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              <Card
                variant="outlined"
                sx={{ gridColumn: { md: "1 / -1" }, gridRow: 1 }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>
                    Category Breakdown
                  </Typography>
                  <ComparisonBarChart
                    prevMonth={comparison.previousYear}
                    currMonth={comparison.currentYear}
                    emptyMessage="No category data for the selected years"
                    height={220}
                  />
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ overflowX: "auto", "& > div": { minWidth: 440 } }}>
                    <TagsComparison
                      previous={comparison.previousYear}
                      current={comparison.currentYear}
                      previousLabel={String(previousYear)}
                      currentLabel={String(currentYear)}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
