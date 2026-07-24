"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from "@/lib/utils/budget-planner";
import { type CategoryType } from "@/lib/types/types";
import { formatCurrencyWhole } from "@/lib/utils/format";

interface AllocationBarProps {
  categoryTotals: Record<CategoryType, number>;
  monthlyIncome: number;
  leftoverSavings: number;
  overspending: number;
}

export function AllocationBar({
  categoryTotals,
  monthlyIncome,
  leftoverSavings,
  overspending,
}: AllocationBarProps) {
  const totalAllocated = CATEGORY_ORDER.reduce(
    (sum, cat) => sum + categoryTotals[cat],
    0,
  );
  const effectiveTotal =
    monthlyIncome > 0 ? Math.max(totalAllocated, monthlyIncome) : 1;

  const segments = CATEGORY_ORDER.map((category) => {
    const amount = categoryTotals[category];
    const pct = monthlyIncome > 0 ? (amount / effectiveTotal) * 100 : 0;
    return { category, amount, pct };
  }).filter((s) => s.amount > 0);

  const savingsPct =
    monthlyIncome > 0
      ? Math.max(((monthlyIncome - totalAllocated) / monthlyIncome) * 100, 0)
      : 0;

  return (
    <Paper
      variant="outlined"
      sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.5, sm: 2 } }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          ALLOCATION
        </Typography>
        {overspending > 0 && (
          <Typography variant="caption" color="warning.main" fontWeight={600}>
            Over budget
          </Typography>
        )}
      </Stack>

      <Box
        sx={{
          display: "flex",
          width: "100%",
          height: 28,
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: alpha("#ffffff", 0.05),
          position: "relative",
        }}
      >
        {segments.map(({ category, pct }) => (
          <Box
            key={category}
            sx={{
              width: `${pct}%`,
              height: "100%",
              bgcolor: CATEGORY_COLORS[category],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "width 0.4s ease-in-out",
              minWidth: pct > 5 ? 0 : 0,
              overflow: "hidden",
            }}
          >
            {pct > 12 && (
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{
                  color: "#000",
                  fontSize: 10,
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
              >
                {CATEGORY_LABELS[category]}
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      <Stack
        direction="row"
        spacing={2}
        sx={{ mt: 1.25, flexWrap: "wrap", rowGap: 1 }}
        useFlexGap
      >
        {segments.map(({ category, amount, pct }) => (
          <Stack
            key={category}
            direction="row"
            spacing={0.5}
            alignItems="center"
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: CATEGORY_COLORS[category],
                flexShrink: 0,
              }}
            />
            <Typography variant="body2" fontWeight={600}>
              {CATEGORY_LABELS[category]}:
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatCurrencyWhole(amount)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({pct.toFixed(0)}%)
            </Typography>
          </Stack>
        ))}
        {leftoverSavings > 0 && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: CATEGORY_COLORS.Saving,
                flexShrink: 0,
                opacity: 0.6,
              }}
            />
            <Typography variant="body2" fontWeight={600}>
              Unallocated:
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatCurrencyWhole(leftoverSavings)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({savingsPct.toFixed(0)}%)
            </Typography>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
