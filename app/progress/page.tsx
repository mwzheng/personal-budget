"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import GoalEditor from "@/components/progress/GoalEditor";
import MilestonesList from "@/components/progress/MilestonesList";
import ProgressCharts from "@/components/progress/ProgressCharts";
import { ProgressYearFilter } from "@/components/progress/ProgressYearFilter";
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
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
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

  const availableYears = useMemo(() => {
    const years = new Set<string>();

    for (const entry of salaryEntries) {
      years.add(String(entry.year));
    }

    for (const entry of retirementEntries) {
      years.add(String(entry.year));
    }

    return Array.from(years).sort(
      (left, right) => Number(left) - Number(right),
    );
  }, [retirementEntries, salaryEntries]);

  useEffect(() => {
    setSelectedYears((currentYears) =>
      currentYears.filter((year) => availableYears.includes(year)),
    );
  }, [availableYears]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Progress Tracker
      </Typography>

      <Stack spacing={3}>
        <Paper sx={{ p: 2 }} elevation={1}>
          <GoalEditor />
        </Paper>

        <Paper sx={{ p: 2 }} elevation={1}>
          <ProgressYearFilter
            availableYears={availableYears}
            selectedYears={selectedYears}
            onChange={setSelectedYears}
          />
        </Paper>

        <Paper sx={{ p: 2 }} elevation={1}>
          <ProgressCharts
            salaryEntries={salaryEntries}
            retirementEntries={retirementEntries}
            selectedYears={selectedYears}
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
            <Paper sx={{ p: 2, height: "100%" }} elevation={1}>
              <RetirementList onEntriesChanged={refreshChartData} />
            </Paper>
          </Box>
          <Box>
            <Paper sx={{ p: 2, height: "100%" }} elevation={1}>
              <MilestonesList />
            </Paper>
          </Box>
        </Box>

        <Paper sx={{ p: 2 }} elevation={1}>
          <SalaryList
            selectedYears={selectedYears}
            onEntriesChanged={refreshChartData}
          />
        </Paper>
      </Stack>
    </Container>
  );
}
