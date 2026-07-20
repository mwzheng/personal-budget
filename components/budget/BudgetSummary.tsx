"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { BudgetPieChart } from "@/components/charts/BudgetPieChart";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from "@/lib/utils/budget-planner";
import { type BudgetInsights } from "@/lib/utils/budget-planner";
import { formatCurrency, formatCurrencyWhole } from "@/lib/utils/format";

interface Props {
  insights: BudgetInsights;
  isLoading: boolean;
  compact?: boolean;
}

export function BudgetSummary({ insights, isLoading, compact }: Props) {
  const { monthlyIncome, categoryTotals, overspending, leftoverSavings } =
    insights;

  return (
    <Stack spacing={compact ? 1.5 : 2.5}>
      {isLoading ? (
        <Skeleton variant="rectangular" height={260} />
      ) : (
        <BudgetPieChart
          data={insights.pieData}
          monthlyIncome={insights.monthlyIncome}
          leftoverSavings={insights.leftoverSavings}
          overspending={insights.overspending}
        />
      )}

      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          pt: compact ? 1.5 : 2.5,
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{
            mb: compact ? 1 : 2,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}
          color="text.secondary"
        >
          Category Breakdown
        </Typography>

        <Stack spacing={compact ? 1.25 : 2}>
          {isLoading
            ? Array.from({ length: 3 }, (_, i) => (
                <Box key={`cat-skeleton-${i}`}>
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton
                    variant="rounded"
                    height={8}
                    sx={{ mt: 0.5, borderRadius: 4 }}
                  />
                </Box>
              ))
            : CATEGORY_ORDER.map((category) => {
                const amount = categoryTotals[category];
                const share =
                  monthlyIncome > 0
                    ? Math.min((amount / monthlyIncome) * 100, 999)
                    : 0;
                const categoryColor = CATEGORY_COLORS[category];

                return (
                  <Box key={category}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          component="span"
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: categoryColor,
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                        {CATEGORY_LABELS[category]}
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrencyWhole(amount)}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="span"
                          sx={{ ml: 0.5 }}
                        >
                          {share.toFixed(0)}%
                        </Typography>
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(share, 100)}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        mt: 0.75,
                        bgcolor: alpha(categoryColor, 0.12),
                        "& .MuiLinearProgress-bar": {
                          bgcolor: categoryColor,
                          borderRadius: 3,
                          transition: "transform 0.6s ease-in-out",
                        },
                      }}
                    />
                  </Box>
                );
              })}
        </Stack>
      </Box>

      {!isLoading &&
      insights.validExpenses.length > 0 &&
      (overspending > 0 || leftoverSavings > 0) ? (
        overspending > 0 ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Overspending by <strong>{formatCurrency(overspending)}</strong>.
            Lower expenses or raise income.
          </Alert>
        ) : (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            <strong>{formatCurrency(leftoverSavings)}</strong> left over after
            all expenses.
          </Alert>
        )
      ) : null}
    </Stack>
  );
}
