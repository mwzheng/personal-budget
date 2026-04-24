"use client";

import React, { useCallback, useEffect, useState } from "react";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import GoalEditor from "@/components/progress/GoalEditor";
import HistoryTabs from "@/components/progress/HistoryTabs";
import MilestonesList from "@/components/progress/MilestonesList";
import ProgressCharts from "@/components/progress/ProgressCharts";
import ProgressSummaryStats from "@/components/progress/ProgressSummaryStats";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
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

  // Note 3: goalRefreshTrigger increments after any entry mutation so GoalEditor
  // re-fetches its latestEnd (computed server-side from retirement data). This
  // prevents the progress bar and summary stats from showing a stale value after
  // the user adds or edits a retirement entry.
  const [goalRefreshTrigger, setGoalRefreshTrigger] = useState(0);

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

  // Note 4: handleEntriesChanged is separate from refreshChartData so that
  // mutations (add/edit/delete retirement entries) also trigger GoalEditor to
  // re-fetch the server-computed latestEnd. refreshChartData on its own is
  // still used for the initial page load where the trigger should not fire.
  const handleEntriesChanged = useCallback(async () => {
    await refreshChartData();
    setGoalRefreshTrigger((t) => t + 1);
  }, [refreshChartData]);

  useEffect(() => {
    void refreshChartData();
  }, [refreshChartData]);

  return (
    <Container component="main" maxWidth="xl" sx={{ py: { xs: 4, md: 5 } }}>
      <PageHeader
        title="Progress Tracker"
        description="Review salary history, retirement contributions, and milestones from one long-term progress workspace."
        sx={{ mb: 3 }}
      />

      {/* Summary stats strip — derives metrics from already-fetched page
          state. Renders above the goal paper so it reads as a dashboard overview. */}
      <ProgressSummaryStats
        retirementEntries={retirementEntries}
        salaryEntries={salaryEntries}
        goalTargetAmount={goalTargetAmount}
        latestEnd={goalLatestEnd}
      />

      <Stack spacing={3} sx={{ mt: 3 }}>
        <SectionCard
          title="Savings Goal"
          headingId="progress-goal-heading"
          elevation={1}
        >
          <GoalEditor
            onGoalData={handleGoalData}
            refreshTrigger={goalRefreshTrigger}
          />
        </SectionCard>

        <SectionCard
          title="Charts"
          headingId="progress-charts-heading"
          elevation={1}
        >
          <ProgressCharts
            salaryEntries={salaryEntries}
            retirementEntries={retirementEntries}
            loading={chartLoading}
            error={chartError}
            goalTargetAmount={goalTargetAmount}
          />
        </SectionCard>

        {/* HistoryTabs consolidates RetirementList and SalaryList into
            one tabbed section to reduce vertical page length. Both panels stay
            mounted (display:none on inactive) so CRUD state survives tab switches. */}
        <SectionCard
          title="History"
          headingId="progress-history-heading"
          elevation={1}
        >
          <HistoryTabs onEntriesChanged={handleEntriesChanged} />
        </SectionCard>

        <SectionCard
          title="Milestones"
          headingId="progress-milestones-heading"
          elevation={1}
        >
          <MilestonesList />
        </SectionCard>
      </Stack>
    </Container>
  );
}
