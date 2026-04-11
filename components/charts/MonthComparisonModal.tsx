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
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { format, parseISO } from "date-fns";
import { useMemo, useState, useEffect } from "react";

import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import {
  buildMonthComparison,
  getAvailableMonths,
  getDefaultComparisonMonths,
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
  /** When true, a positive change is favorable (green). Default: false (spending). */
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
          bgcolor: "rgba(255,255,255,0.08)",
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
          bgcolor: "rgba(255,255,255,0.08)",
          color: "text.secondary",
        }}
      />
    );
  }

  const isFavorable = positiveIsFavorable ? value > 0 : value < 0;
  const color = isFavorable ? "#66bb6a" : "#ef5350";
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
  monthA: number;
  monthB: number;
  change: number | null;
  color?: string;
  positiveIsFavorable?: boolean;
}

function SummaryCard({
  label,
  monthA,
  monthB,
  change,
  color = "text.primary",
  positiveIsFavorable = false,
}: SummaryCardProps) {
  return (
    <Card variant="outlined" sx={{ flex: 1 }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={0.5}
        >
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <ChangeIndicator
            value={change}
            positiveIsFavorable={positiveIsFavorable}
          />
        </Box>
        <Stack direction="row" spacing={2} alignItems="baseline">
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              fontSize="0.65rem"
            >
              Month A
            </Typography>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color }}>
              {formatCurrency(monthA)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              fontSize="0.65rem"
            >
              Month B
            </Typography>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color }}>
              {formatCurrency(monthB)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function TagsComparison({ comparison }: { comparison: MonthComparisonData }) {
  const { monthA, monthB } = comparison;
  const allTagNames = useMemo(() => {
    const set = new Set<string>();
    for (const t of monthA.topTags) set.add(t.name);
    for (const t of monthB.topTags) set.add(t.name);
    return Array.from(set).sort();
  }, [monthA.topTags, monthB.topTags]);

  if (allTagNames.length === 0) return null;

  const aMap = Object.fromEntries(monthA.topTags.map((t) => [t.name, t.value]));
  const bMap = Object.fromEntries(monthB.topTags.map((t) => [t.name, t.value]));

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} mb={1}>
        Top Tags
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto auto",
          gap: 1,
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
          Month A
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          textAlign="right"
        >
          Month B
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          textAlign="right"
        >
          Change
        </Typography>
        {allTagNames.slice(0, 8).map((tag) => {
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
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
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
  const [periodA, setPeriodA] = useState(defaults[0]);
  const [periodB, setPeriodB] = useState(defaults[1]);

  // Reset periods when the modal opens with new transaction data
  useEffect(() => {
    if (open) {
      const [a, b] = getDefaultComparisonMonths(transactions);
      setPeriodA(a);
      setPeriodB(b);
    }
  }, [open, transactions]);

  const comparison = useMemo(
    () => buildMonthComparison(transactions, periodA, periodB),
    [transactions, periodA, periodB],
  );

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
      <DialogContent sx={{ pt: 2.5 }}>
        {/* Month selectors */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          mb={3}
        >
          <MonthSelector
            label="Month A"
            value={periodA}
            months={availableMonths}
            onChange={setPeriodA}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ alignSelf: "center" }}
          >
            vs
          </Typography>
          <MonthSelector
            label="Month B"
            value={periodB}
            months={availableMonths}
            onChange={setPeriodB}
          />
        </Stack>

        {/* Period labels */}
        <Stack direction="row" spacing={1} mb={2}>
          <Chip
            label={`A: ${formatMonthLabel(periodA)}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`B: ${formatMonthLabel(periodB)}`}
            size="small"
            variant="outlined"
          />
        </Stack>

        {/* Summary cards */}
        <Grid container spacing={1.5} mb={3}>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              label="Total"
              monthA={comparison.monthA.totalAmount}
              monthB={comparison.monthB.totalAmount}
              change={comparison.changes.totalAmount}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              label="Spending"
              monthA={comparison.monthA.spendingAmount}
              monthB={comparison.monthB.spendingAmount}
              change={comparison.changes.spendingAmount}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              label="Needs"
              monthA={comparison.monthA.totalByCategoryType.Need}
              monthB={comparison.monthB.totalByCategoryType.Need}
              change={comparison.changes.Need}
              color={CATEGORY_HEX_COLORS.Need}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              label="Wants"
              monthA={comparison.monthA.totalByCategoryType.Want}
              monthB={comparison.monthB.totalByCategoryType.Want}
              change={comparison.changes.Want}
              color={CATEGORY_HEX_COLORS.Want}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              label="Savings"
              monthA={comparison.monthA.totalByCategoryType.Saving}
              monthB={comparison.monthB.totalByCategoryType.Saving}
              change={comparison.changes.Saving}
              color={CATEGORY_HEX_COLORS.Saving}
              positiveIsFavorable
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              label="Transactions"
              monthA={comparison.monthA.transactionCount}
              monthB={comparison.monthB.transactionCount}
              change={comparison.changes.transactionCount}
            />
          </Grid>
        </Grid>

        {/* Grouped bar chart */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Category Comparison
            </Typography>
            <ComparisonBarChart
              monthA={comparison.monthA}
              monthB={comparison.monthB}
            />
          </CardContent>
        </Card>

        {/* Tags comparison */}
        <Card variant="outlined">
          <CardContent sx={{ p: 2 }}>
            <TagsComparison comparison={comparison} />
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
