"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Container } from "@mui/material";
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
      setGoalLatestEnd(data.latestEnd ?? null);
    } catch {
      // The hero retains its current values when goal data is unavailable.
    }
  }, []);

  const handleEntriesChanged = useCallback(async () => {
    await Promise.all([
      refreshChartData(),
      refreshMilestones(),
      refreshGoalData(),
    ]);
    setGoalRefreshTrigger((t) => t + 1);
  }, [refreshChartData, refreshMilestones, refreshGoalData]);

  useEffect(() => {
    void refreshChartData();
    void refreshMilestones();
    void refreshGoalData();
  }, [refreshChartData, refreshMilestones, refreshGoalData]);

  return (
    <Container component="main" maxWidth="xl" sx={{ py: { xs: 4, md: 5 } }}>
      <PageHeader
        title="Your path to financial freedom"
        description="Track the goal, career, and milestones that shape your long-term progress."
        action={
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setGoalDialogOpen(true)}
            >
              Edit goal
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => setMilestoneDialogOpen(true)}
            >
              Add milestone
            </Button>
          </Box>
        }
        sx={{ mb: 3 }}
      />

      {/* Hero section */}
      <GoalHero
        goalTargetAmount={goalTargetAmount}
        latestEnd={goalLatestEnd}
        salaryEntries={salaryEntries}
        retirementEntries={retirementEntries}
        milestones={milestones}
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
        {/* Charts — wider on desktop */}
        <Grid item xs={12} md={8}>
          <SectionCard
            title="Progress Over Time"
            description="Savings and salary growth in one view"
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
        <Grid item xs={12} md={4}>
          <SectionCard
            title="Milestones"
            description="Celebrate the next step"
            headingId="progress-milestones-heading"
            elevation={1}
            sx={{ height: "100%" }}
          >
            <MilestonesList
              milestones={milestones}
              loading={chartLoading}
              currentAmount={goalLatestEnd}
              onMilestonesChanged={refreshMilestones}
            />
          </SectionCard>
        </Grid>

        {/* History — full width */}
        <Grid item xs={12}>
          <SectionCard
            title="Career & savings history"
            description="Use your history to understand the story behind the progress."
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
