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
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import {
  ChangeIndicator,
  TagsComparison,
  type ComparisonMetric,
} from "@/components/charts/ComparisonDetails";
import {
  buildMonthComparison,
  getDefaultComparisonMonths,
  getMonthsInTransactionRange,
} from "@/lib/utils/aggregations";
import { CATEGORY_HEX_COLORS } from "@/lib/utils/categoryColors";
import { formatCurrency } from "@/lib/utils/format";
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
      sx={{ flex: { xs: 1, sm: "none" }, minWidth: 0, width: { sm: 220 } }}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: {
                xs: "min(300px, 45vh)",
                sm: "min(360px, 50vh)",
              },
              overflowY: "auto",
            },
          },
        }}
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
  const months = useMemo(
    () => getMonthsInTransactionRange(transactions),
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
      maxWidth={false}
      fullWidth
      PaperProps={{ sx: { width: "min(1500px, calc(100% - 32px))", m: 2 } }}
      aria-labelledby="month-comparison-title"
    >
      <DialogTitle
        id="month-comparison-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700} component="span">
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
        {loading ? (
          <Box
            role="status"
            aria-label="Loading monthly comparison"
            sx={{ display: "flex", justifyContent: "center", py: 8 }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={onRetry}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : months.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={5}>
            Add transactions to compare months.
          </Typography>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
              }}
            >
              <MonthSelector
                label="Compare From"
                value={previousMonth}
                months={months}
                onChange={setPreviousMonth}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                to
              </Typography>
              <MonthSelector
                label="Compare To"
                value={currentMonth}
                months={months}
                onChange={setCurrentMonth}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              textAlign="center"
              mt={1.5}
              mb={1}
            >
              Uses your full transaction history, regardless of report filters.
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
                            {formatMonthLabel(previousMonth)}
                          </Box>
                          <Box
                            component="th"
                            scope="col"
                            sx={{ typography: "caption", fontWeight: 600 }}
                          >
                            {formatMonthLabel(currentMonth)}
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
                              {(metric.formatter ?? formatCurrency)(
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
                              {(metric.formatter ?? formatCurrency)(
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
                    prevMonth={comparison.prevMonth}
                    currMonth={comparison.currMonth}
                    height={220}
                  />
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ overflowX: "auto", "& > div": { minWidth: 440 } }}>
                    <TagsComparison
                      previous={comparison.prevMonth}
                      current={comparison.currMonth}
                      previousLabel={formatMonthLabel(previousMonth)}
                      currentLabel={formatMonthLabel(currentMonth)}
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
