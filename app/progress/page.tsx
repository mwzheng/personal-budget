"use client";

import React, { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import GoalEditor from "@/components/progress/GoalEditor";
import MilestonesList from "@/components/progress/MilestonesList";
import ProgressCharts from "@/components/progress/ProgressCharts";
import RetirementList from "@/components/ui/RetirementList";
import SalaryList from "@/components/ui/SalaryList";
import { apiFetch } from "@/lib/api/apiFetch";
import type { RetirementEntry, SalaryEntry } from "@/lib/types/types";

interface ApiEntriesResponse<T> {
  ok: boolean;
  entries?: T[];
  error?: string;
}

const PAGE_TITLE_ID = "progress-page-title";
const PAGE_DESCRIPTION_ID = "progress-page-description";

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
    <Container
      component="main"
      maxWidth="xl"
      aria-labelledby={PAGE_TITLE_ID}
      aria-describedby={PAGE_DESCRIPTION_ID}
      sx={{ py: 4 }}
    >
      <Typography
        id={PAGE_TITLE_ID}
        component="h1"
        variant="h4"
        fontWeight={700}
        gutterBottom
      >
        Progress Tracker
      </Typography>
      <Typography
        id={PAGE_DESCRIPTION_ID}
        variant="body2"
        color="text.secondary"
      >
        Review salary history, retirement contributions, and milestones from one
        long-term progress workspace.
      </Typography>

      <Stack spacing={3} sx={{ mt: 3 }}>
        <Paper sx={{ p: 3 }} elevation={1}>
          <GoalEditor />
        </Paper>

        <Paper sx={{ p: 3 }} elevation={1}>
          <ProgressCharts
            salaryEntries={salaryEntries}
            retirementEntries={retirementEntries}
            loading={chartLoading}
            error={chartError}
          />
        </Paper>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "repeat(2, minmax(0, 1fr))",
            },
          }}
        >
          <Box>
            <Paper sx={{ p: 3, height: "100%" }} elevation={1}>
              <RetirementList onEntriesChanged={refreshChartData} />
            </Paper>
          </Box>
          <Box>
            <Paper sx={{ p: 3, height: "100%" }} elevation={1}>
              <MilestonesList />
            </Paper>
          </Box>
        </Box>

        <Paper sx={{ p: 3 }} elevation={1}>
          <SalaryList onEntriesChanged={refreshChartData} />
        </Paper>
      </Stack>
    </Container>
  );
}
