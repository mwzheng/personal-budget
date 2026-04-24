"use client";

import React, { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import GoalEditor from "@/components/progress/GoalEditor";
import MilestonesList from "@/components/progress/MilestonesList";
import ProgressCharts from "@/components/progress/ProgressCharts";
import ProgressSummaryStats from "@/components/progress/ProgressSummaryStats";
import PageHeader from "@/components/ui/PageHeader";
import RetirementList from "@/components/ui/RetirementList";
import SalaryList from "@/components/ui/SalaryList";
import { apiFetch } from "@/lib/api/apiFetch";
import type { RetirementEntry, SalaryEntry } from "@/lib/types/types";

interface ApiEntriesResponse<T> {
  ok: boolean;
  entries?: T[];
  error?: string;
}

export default function Page() {
  // Note 1: The page owns the shared chart dataset so salary/retirement edits can
  // refresh the year filter and the progress chart immediately, without waiting
  // for a full page reload or trying to coordinate sibling components directly.
  const [salaryEntries, setSalaryEntries] = useState<SalaryEntry[]>([]);
  const [retirementEntries, setRetirementEntries] = useState<RetirementEntry[]>(
    [],
  );
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  // Note 2: goalData is lifted here so ProgressSummaryStats stays in sync with
  // GoalEditor saves without introducing an additional API call at page level.
  const [goalTargetAmount, setGoalTargetAmount] = useState<number | null>(null);
  const [goalLatestEnd, setGoalLatestEnd] = useState<number | null>(null);

  const handleGoalData = useCallback(
    (targetAmount: number | null, latestEnd: number | null) => {
      setGoalTargetAmount(targetAmount);
      setGoalLatestEnd(latestEnd);
    },
    [],
  );

  const refreshChartData = useCallback(async () => {
    setChartLoading(true);
    setChartError(null);

    try {
      const [salaryResponse, retirementResponse] = await Promise.all([
        apiFetch("/api/salary"),
        apiFetch("/api/progress/retirement"),
      ]);

      const [salaryData, retirementData] = (await Promise.all([
        salaryResponse.json(),
        retirementResponse.json(),
      ])) as [
        ApiEntriesResponse<SalaryEntry>,
        ApiEntriesResponse<RetirementEntry>,
      ];

      if (!salaryData.ok) {
        throw new Error(salaryData.error || "Failed to load salary history");
      }

      if (!retirementData.ok) {
        throw new Error(
          retirementData.error || "Failed to load retirement history",
        );
      }

      setSalaryEntries(salaryData.entries ?? []);
      setRetirementEntries(retirementData.entries ?? []);
    } catch (error) {
      setChartError(error instanceof Error ? error.message : String(error));
    } finally {
      setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshChartData();
  }, [refreshChartData]);

  return (
    <Container component="main" maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Progress Tracker"
        description="Review salary history, retirement contributions, and milestones from one long-term progress workspace."
      />

      {/* Note 3: Summary stats strip — derives metrics from already-fetched page
          state. Renders above the goal paper so it reads as a dashboard overview. */}
      <Box sx={{ mt: 3 }}>
        <ProgressSummaryStats
          retirementEntries={retirementEntries}
          salaryEntries={salaryEntries}
          goalTargetAmount={goalTargetAmount}
          latestEnd={goalLatestEnd}
        />
      </Box>

      <Stack spacing={3} sx={{ mt: 3 }}>
        <Paper sx={{ p: 3 }} elevation={1}>
          <GoalEditor onGoalData={handleGoalData} />
        </Paper>

        <Paper sx={{ p: 3 }} elevation={1}>
          <ProgressCharts
            salaryEntries={salaryEntries}
            retirementEntries={retirementEntries}
            loading={chartLoading}
            error={chartError}
          />
        </Paper>

        <Paper sx={{ p: 3 }} elevation={1}>
          <RetirementList onEntriesChanged={refreshChartData} />
        </Paper>

        <Paper sx={{ p: 3 }} elevation={1}>
          <MilestonesList />
        </Paper>

        <Paper sx={{ p: 3 }} elevation={1}>
          <SalaryList onEntriesChanged={refreshChartData} />
        </Paper>
      </Stack>
    </Container>
  );
}
