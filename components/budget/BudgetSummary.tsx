"use client";

import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { BudgetPieChart } from "@/components/charts/BudgetPieChart";
import { type BudgetInsights } from "@/lib/utils/budget-planner";
import { formatCurrency } from "@/lib/utils/format";

interface Props {
  insights: BudgetInsights;
  isLoading: boolean;
}

export function BudgetSummary({ insights, isLoading }: Props) {
  const { overspending, leftoverSavings } = insights;

  return (
    <Stack spacing={2.5}>
      {isLoading ? (
        <Skeleton variant="rectangular" height={320} />
      ) : (
        <BudgetPieChart
          data={insights.pieData}
          monthlyIncome={insights.monthlyIncome}
          leftoverSavings={insights.leftoverSavings}
          overspending={insights.overspending}
        />
      )}

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
