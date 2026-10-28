"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Container } from "@mui/material";
import { WORKSPACE_MAX_WIDTH } from "@/lib/theme/layout";
import Grid from "@mui/material/Grid";
import GoalHero from "@/components/progress/GoalHero";
import GoalEditor from "@/components/progress/GoalEditor";
import MilestoneForm from "@/components/forms/MilestoneForm";
import MilestonesList from "@/components/progress/MilestonesList";
import ProgressCharts from "@/components/progress/ProgressCharts";
import { ProgressEntryDialog } from "@/components/progress/ProgressEntryDialog";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import RetirementList from "@/components/ui/RetirementList";
import { apiFetch } from "@/lib/api/apiFetch";
import { getLatestRetirementTotal } from "@/lib/progress/progress-summary";
import type { MilestoneEntry, RetirementEntry } from "@/lib/types/types";

interface ApiEntriesResponse<T> {
  ok: boolean;
  entries?: T[];
  error?: string;
}

export default function Page() {
  const [retirementEntries, setRetirementEntries] = useState<RetirementEntry[]>(
    [],
  );
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  const [goalTargetAmount, setGoalTargetAmount] = useState<number | null>(null);

  const [goalRefreshTrigger, setGoalRefreshTrigger] = useState(0);

  const [milestones, setMilestones] = useState<MilestoneEntry[]>([]);

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);

  const handleGoalData = useCallback((targetAmount: number | null) => {
    setGoalTargetAmount(targetAmount);
  }, []);

  const refreshRetirementData = useCallback(async () => {
    setChartLoading(true);
    setChartError(null);

    try {
      const retirementResponse = await apiFetch("/api/progress/retirement");
      const retirementData =
        (await retirementResponse.json()) as ApiEntriesResponse<RetirementEntry>;
      if (!retirementData.ok) {
        throw new Error(
          retirementData.error || "Failed to load retirement history",
        );
      }
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

  const refreshGoalData = useCallback(async () => {
    try {
      const res = await apiFetch("/api/progress/goal");
      const data = (await res.json()) as {
        ok: boolean;
        goals?: Array<{ targetAmount?: number; goalId?: string }>;
        latestEnd?: number;
      };
      if (!data.ok) return;
      setGoalTargetAmount(data.goals?.[0]?.targetAmount ?? null);
    } catch {
      // The hero retains its current values when goal data is unavailable.
    }
  }, []);

  const handleRetirementEntriesChanged = useCallback(async () => {
    await Promise.all([refreshRetirementData(), refreshGoalData()]);
    setGoalRefreshTrigger((t) => t + 1);
  }, [refreshGoalData, refreshRetirementData]);

  useEffect(() => {
    void refreshRetirementData();
    void refreshMilestones();
    void refreshGoalData();
  }, [refreshRetirementData, refreshMilestones, refreshGoalData]);

  return (
    <Container
      component="main"
      maxWidth={false}
      sx={{ py: { xs: 4, md: 5 }, maxWidth: WORKSPACE_MAX_WIDTH }}
    >
      <PageHeader
        title="Savings Progress"
        description="Track your retirement savings and the milestones along the way."
        sx={{ mb: 3 }}
      />

      {/* Hero section */}
      <GoalHero
        goalTargetAmount={goalTargetAmount}
        retirementEntries={retirementEntries}
        milestones={milestones}
        onAddMilestone={() => setMilestoneDialogOpen(true)}
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
          onSaved={async () => {
            await refreshGoalData();
            setGoalDialogOpen(false);
          }}
        />
      </ProgressEntryDialog>

      {/* Milestone add dialog */}
      <ProgressEntryDialog
        open={milestoneDialogOpen}
        title="Add Milestone"
        onClose={() => setMilestoneDialogOpen(false)}
      >
        <MilestoneForm
          onSaved={async () => {
            await refreshMilestones();
            setMilestoneDialogOpen(false);
          }}
          onCancel={() => setMilestoneDialogOpen(false)}
        />
      </ProgressEntryDialog>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        {/* Retirement trend */}
        <Grid item xs={12}>
          <SectionCard
            title="Retirement Savings Over Time"
            headingId="progress-charts-heading"
            elevation={1}
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            contentSx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <ProgressCharts
              retirementEntries={retirementEntries}
              loading={chartLoading}
              error={chartError}
              goalTargetAmount={goalTargetAmount}
              milestones={milestones}
            />
          </SectionCard>
        </Grid>

        {/* Milestones */}
        <Grid item xs={12} lg={5}>
          <SectionCard
            title="Milestones"
            description="Celebrate the next step"
            headingId="progress-milestones-heading"
            elevation={1}
            sx={{ height: { lg: "100%" } }}
          >
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setMilestoneDialogOpen(true)}
              >
                Add milestone
              </Button>
            </Box>
            <MilestonesList
              milestones={milestones}
              loading={chartLoading}
              currentAmount={getLatestRetirementTotal(retirementEntries)}
              onMilestonesChanged={refreshMilestones}
            />
          </SectionCard>
        </Grid>

        {/* Retirement history */}
        <Grid item xs={12} lg={7} id="retirement-history">
          <SectionCard
            title="Retirement History"
            description="Review and update your retirement account balances."
            headingId="progress-history-heading"
            elevation={1}
            sx={{ height: { lg: "100%" } }}
          >
            <RetirementList
              entries={retirementEntries}
              loading={chartLoading}
              onEntriesChanged={handleRetirementEntriesChanged}
            />
          </SectionCard>
        </Grid>
      </Grid>
    </Container>
  );
}
