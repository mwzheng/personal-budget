"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useState } from "react";

import { BudgetSummary } from "@/components/budget/BudgetSummary";
import type { BudgetInsights } from "@/lib/utils/budget-planner";
import dynamic from "next/dynamic";

const SankeyChart = dynamic(
  () =>
    import("@/components/charts/SankeyChart").then(
      (module) => module.SankeyChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton variant="rectangular" height={400} />,
  },
);

interface BudgetVisualizationProps {
  insights: BudgetInsights;
  isLoading: boolean;
  compact?: boolean;
}

export function BudgetVisualization({
  insights,
  isLoading,
  compact,
}: BudgetVisualizationProps) {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, next) => setTab(next)}
        variant="fullWidth"
        sx={{
          minHeight: 36,
          "& .MuiTab-root": {
            minHeight: 36,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8125rem",
          },
          mb: compact ? 1.5 : 2,
        }}
      >
        <Tab label="Breakdown" />
        <Tab label="Flow" />
      </Tabs>

      {tab === 0 && (
        <BudgetSummary
          insights={insights}
          isLoading={isLoading}
          compact={compact}
        />
      )}

      {tab === 1 && (
        <Box sx={{ minHeight: 400 }}>
          {isLoading ? (
            <Skeleton variant="rectangular" height={400} />
          ) : (
            <SankeyChart data={insights.sankeyData} />
          )}
        </Box>
      )}
    </Box>
  );
}
