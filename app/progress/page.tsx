"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, Container } from "@mui/material";
import Grid from "@mui/material/Grid";
import GoalHero from "@/components/progress/GoalHero";
import GoalEditor from "@/components/progress/GoalEditor";
import MilestoneForm from "@/components/forms/MilestoneForm";
import HistoryTabs from "@/components/progress/HistoryTabs";
import MilestonesList from "@/components/progress/MilestonesList";
import ProgressCharts from "@/components/progress/ProgressCharts";
import { ProgressEntryDialog } from "@/components/progress/ProgressEntryDialog";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { apiFetch } from "@/lib/api/apiFetch";
import type {
  MilestoneEntry,
  RetirementEntry,
  SalaryEntry,
} from "@/lib/types/types";

interface ApiEntriesResponse<T> {
  ok: boolean;
  entries?: T[];
  error?: string;
}

export default function Page() {
  const [salaryEntries, setSalaryEntries] = useState<SalaryEntry[]>([]);
  const [retirementEntries, setRetirementEntries] = useState<RetirementEntry[]>(
    [],
  );
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  const [goalTargetAmount, setGoalTargetAmount] = useState<number | null>(null);
  const [goalLatestEnd, setGoalLatestEnd] = useState<number | null>(null);

  const [goalRefreshTrigger, setGoalRefreshTrigger] = useState(0);

  const [milestones, setMilestones] = useState<MilestoneEntry[]>([]);

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);

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

  const refreshMilestones = useCallback(async () => {
    try {
      const res = await apiFetch("/api/progress/milestones");
      const data = (await res.json()) as ApiEntriesResponse<MilestoneEntry>;
      if (data.ok) {
        setMilestones(data.entries ?? []);
      }
    } catch {
      /* non-critical */
    }
  }, []);

  const handleEntriesChanged = useCallback(async () => {
    await refreshChartData();
    await refreshMilestones();
    setGoalRefreshTrigger((t) => t + 1);
  }, [refreshChartData, refreshMilestones]);

  useEffect(() => {
    void refreshChartData();
    void refreshMilestones();
  }, [refreshChartData, refreshMilestones]);

  return (
    <Container component="main" maxWidth="xl" sx={{ py: { xs: 4, md: 5 } }}>
      <PageHeader
        title="Progress Tracker"
        description="Review salary history, retirement contributions, and milestones from one long-term progress workspace."
        sx={{ mb: 3 }}
      />

      {/* Hero section */}
      <GoalHero
        goalTargetAmount={goalTargetAmount}
        latestEnd={goalLatestEnd}
        salaryEntries={salaryEntries}
        retirementEntries={retirementEntries}
        onEditGoal={() => setGoalDialogOpen(true)}
        loading={chartLoading}
      />

      {/* Goal editor dialog */}
      <ProgressEntryDialog
        open={goalDialogOpen}
        title={
          goalTargetAmount !== null ? "Edit Progress Goal" : "Set Progress Goal"
        }
        onClose={() => setGoalDialogOpen(false)}
      >
        <GoalEditor
          onGoalData={handleGoalData}
          refreshTrigger={goalRefreshTrigger}
          onSaved={() => setGoalDialogOpen(false)}
        />
      </ProgressEntryDialog>

      {/* Milestone add dialog */}
      <ProgressEntryDialog
        open={milestoneDialogOpen}
        title="Add Milestone"
        onClose={() => setMilestoneDialogOpen(false)}
      >
        <MilestoneForm
          onSaved={() => {
            setMilestoneDialogOpen(false);
            void refreshMilestones();
          }}
          onCancel={() => setMilestoneDialogOpen(false)}
        />
      </ProgressEntryDialog>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        {/* Charts — wider on desktop */}
        <Grid item xs={12} md={7}>
          <SectionCard
            title="Progress Over Time"
            headingId="progress-charts-heading"
            elevation={1}
            sx={{ height: "100%" }}
          >
            <ProgressCharts
              salaryEntries={salaryEntries}
              retirementEntries={retirementEntries}
              loading={chartLoading}
              error={chartError}
              goalTargetAmount={goalTargetAmount}
              milestones={milestones}
            />
          </SectionCard>
        </Grid>

        {/* Milestones — narrower on desktop */}
        <Grid item xs={12} md={5}>
          <SectionCard
            title="Milestones"
            headingId="progress-milestones-heading"
            elevation={1}
            action={
              <Button
                variant="contained"
                size="small"
                onClick={() => setMilestoneDialogOpen(true)}
              >
                Add Milestone
              </Button>
            }
            sx={{ height: "100%" }}
          >
            <MilestonesList
              milestones={milestones}
              loading={chartLoading}
              goalTargetAmount={goalTargetAmount}
              currentAmount={goalLatestEnd}
              onMilestonesChanged={refreshMilestones}
            />
          </SectionCard>
        </Grid>

        {/* History — full width */}
        <Grid item xs={12}>
          <SectionCard
            title="History"
            headingId="progress-history-heading"
            elevation={1}
          >
            <HistoryTabs onEntriesChanged={handleEntriesChanged} />
          </SectionCard>
        </Grid>
      </Grid>
    </Container>
  );
}
