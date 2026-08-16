"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { format, parseISO } from "date-fns";
import { useMemo, useState, useEffect } from "react";

import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import {
  buildMonthComparison,
  getAvailableMonths,
  getDefaultComparisonMonths,
  rankComparisonTags,
} from "@/lib/utils/aggregations";
import { CATEGORY_HEX_COLORS } from "@/lib/utils/categoryColors";
import { formatCurrency } from "@/lib/utils/format";
import type { MonthComparisonData, Transaction } from "@/lib/types/types";

function formatMonthLabel(period: string): string {
  try {
    return format(parseISO(`${period}-01`), "MMMM yyyy");
  } catch {
    return period;
  }
}

interface ChangeIndicatorProps {
  value: number | null;
  positiveIsFavorable?: boolean;
}

function ChangeIndicator({
  value,
  positiveIsFavorable = false,
}: ChangeIndicatorProps) {
  if (value === null) {
    return (
      <Chip
        label="New"
        size="small"
        sx={{
          fontSize: "0.7rem",
          height: 22,
          bgcolor: "action.hover",
          color: "text.secondary",
        }}
      />
    );
  }

  if (value === 0) {
    return (
      <Chip
        label="No change"
        size="small"
        sx={{
          fontSize: "0.7rem",
          height: 22,
          bgcolor: "action.hover",
          color: "text.secondary",
        }}
      />
    );
  }

  const isFavorable = positiveIsFavorable ? value > 0 : value < 0;
  // Use contrast-safe semantic text colors on the light canvas; the brighter
  // palette values remain available for decorative fills and chart accents.
  const color = isFavorable ? "#15803D" : "#B91C1C";
  const icon =
    value > 0 ? (
      <ArrowUpwardIcon sx={{ fontSize: 14 }} />
    ) : (
      <ArrowDownwardIcon sx={{ fontSize: 14 }} />
    );

  return (
    <Chip
      icon={icon}
      label={`${Math.abs(value).toFixed(1)}%`}
      size="small"
      sx={{
        fontSize: "0.7rem",
        height: 22,
        color,
        bgcolor: `${color}1a`,
        "& .MuiChip-icon": { color },
      }}
    />
  );
}

interface SummaryCardProps {
  label: string;
  prevMonth: number;
  currMonth: number;
  change: number | null;
  color?: string;
  formatter?: (value: number) => string;
  positiveIsFavorable?: boolean;
}

type SummaryCardDefinition = SummaryCardProps & { key: string };

function SummaryCard({
  label,
  prevMonth,
  currMonth,
  change,
  color = "text.primary",
  formatter = formatCurrency,
  positiveIsFavorable = false,
}: SummaryCardProps) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          gap={1}
          mb={1.5}
        >
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <ChangeIndicator
            value={change}
            positiveIsFavorable={positiveIsFavorable}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              fontSize="0.7rem"
              mb={0.5}
            >
              Previous Month
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{
                color,
                lineHeight: 1.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {formatter(prevMonth)}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              fontSize="0.7rem"
              mb={0.5}
            >
              Current Month
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{
                color,
                lineHeight: 1.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {formatter(currMonth)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function TagsComparison({ comparison }: { comparison: MonthComparisonData }) {
  const { prevMonth, currMonth } = comparison;
  const allTagNames = useMemo(() => {
    return rankComparisonTags(prevMonth.topTags, currMonth.topTags);
  }, [prevMonth.topTags, currMonth.topTags]);

  if (allTagNames.length === 0) return null;

  const aMap = Object.fromEntries(
    prevMonth.topTags.map((t) => [t.name, t.value]),
  );
  const bMap = Object.fromEntries(
    currMonth.topTags.map((t) => [t.name, t.value]),
  );

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} mb={1}>
        Top Tags
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1.2fr) repeat(3, minmax(84px, 1fr))",
            sm: "minmax(0, 1.2fr) repeat(3, minmax(110px, 1fr))",
          },
          columnGap: { xs: 1.5, sm: 2.5 },
          rowGap: 1.25,
          alignItems: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Tag
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          textAlign="right"
        >
          Previous Month
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          textAlign="right"
        >
          Current Month
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          textAlign="right"
        >
          Change
        </Typography>
        {allTagNames.slice(0, 10).map((tag) => {
          const aVal = aMap[tag] ?? 0;
          const bVal = bMap[tag] ?? 0;
          const diff = aVal === 0 ? null : ((bVal - aVal) / aVal) * 100;
          return (
            <Box key={tag} display="contents">
              <Typography variant="body2" noWrap>
                {tag}
              </Typography>
              <Typography variant="body2" textAlign="right">
                {formatCurrency(aVal)}
              </Typography>
              <Typography variant="body2" textAlign="right">
                {formatCurrency(bVal)}
              </Typography>
              <Box textAlign="right">
                <ChangeIndicator value={diff} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
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
        onChange={(e) => onChange(e.target.value)}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 280,
              "& .MuiMenuItem-root": {
                minHeight: 40,
              },
            },
          },
        }}
      >
        {months.map((m) => (
          <MenuItem key={m} value={m}>
            {formatMonthLabel(m)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

interface MonthComparisonModalProps {
  open: boolean;
  transactions: Transaction[];
  onClose: () => void;
}

export function MonthComparisonModal({
  open,
  transactions,
  onClose,
}: MonthComparisonModalProps) {
  const availableMonths = useMemo(
    () => getAvailableMonths(transactions),
    [transactions],
  );

  const [defaults] = useState(() => getDefaultComparisonMonths(transactions));
  const [previousMonth, setPreviousMonth] = useState(defaults[0]);
  const [currentMonth, setCurrentMonth] = useState(defaults[1]);

  // Reset periods when the modal opens with new transaction data
  useEffect(() => {
    if (open) {
      const [a, b] = getDefaultComparisonMonths(transactions);
      setPreviousMonth(a);
      setCurrentMonth(b);
    }
  }, [open, transactions]);

  const comparison = useMemo(
    () => buildMonthComparison(transactions, previousMonth, currentMonth),
    [transactions, previousMonth, currentMonth],
  );

  const summaryCards: SummaryCardDefinition[] = [
    {
      key: "total",
      label: "Total Activity",
      prevMonth: comparison.prevMonth.totalAmount,
      currMonth: comparison.currMonth.totalAmount,
      change: comparison.changes.totalAmount,
    },
    {
      key: "income",
      label: "Income",
      prevMonth: comparison.prevMonth.incomeAmount,
      currMonth: comparison.currMonth.incomeAmount,
      change: comparison.changes.incomeAmount,
      color: "#26a69a",
      positiveIsFavorable: true,
    },
    {
      key: "spending",
      label: "Spending",
      prevMonth: comparison.prevMonth.spendingAmount,
      currMonth: comparison.currMonth.spendingAmount,
      change: comparison.changes.spendingAmount,
    },
    {
      key: "need",
      label: "Needs",
      prevMonth: comparison.prevMonth.totalByCategoryType.Need,
      currMonth: comparison.currMonth.totalByCategoryType.Need,
      change: comparison.changes.Need,
      color: CATEGORY_HEX_COLORS.Need,
    },
    {
      key: "want",
      label: "Wants",
      prevMonth: comparison.prevMonth.totalByCategoryType.Want,
      currMonth: comparison.currMonth.totalByCategoryType.Want,
      change: comparison.changes.Want,
      color: CATEGORY_HEX_COLORS.Want,
    },
    {
      key: "saving",
      label: "Savings",
      prevMonth: comparison.prevMonth.totalByCategoryType.Saving,
      currMonth: comparison.currMonth.totalByCategoryType.Saving,
      change: comparison.changes.Saving,
      color: CATEGORY_HEX_COLORS.Saving,
      positiveIsFavorable: true,
    },
    {
      key: "transactions",
      label: "Transactions",
      prevMonth: comparison.prevMonth.transactionCount,
      currMonth: comparison.currMonth.transactionCount,
      change: comparison.changes.transactionCount,
      formatter: (value: number) => value.toString(),
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
            flexDirection: { sm: "row" },
            justifyContent: "center",
            alignItems: "center",
            gap: { xs: 1.5, sm: 3 },
            mb: 3,
          }}
        >
          <MonthSelector
            label="Previous Month"
            value={previousMonth}
            months={availableMonths}
            onChange={setPreviousMonth}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ alignSelf: "center" }}
          >
            vs
          </Typography>
          <MonthSelector
            label="Current Month"
            value={currentMonth}
            months={availableMonths}
            onChange={setCurrentMonth}
          />
        </Box>
        <Grid container spacing={2} mb={3}>
          {summaryCards.map(({ key, ...card }) => (
            <Grid key={key} item xs={12} sm={6} md={6}>
              <SummaryCard {...card} />
            </Grid>
          ))}
        </Grid>
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
            <TagsComparison comparison={comparison} />
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
