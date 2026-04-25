"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SaveIcon from "@mui/icons-material/Save";
import PageHeader from "@/components/ui/PageHeader";
import { apiFetch } from "@/lib/api/apiFetch";
import { selectLatestFireScenario } from "@/lib/utils/fire-scenarios";
import {
  buildProjectionBreakdownRows,
  calculateFireNumber,
  generateProjection,
} from "@/lib/utils/fire";
import type { FireScenario, RetirementEntry } from "@/lib/types/types";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";
import FireForm from "./FireForm";
import FireProjectionChart, { FIRE_CHART_LABELS } from "./FireProjectionChart";
import FireProjectionTable from "./FireProjectionTable";
import FireScenarioList from "./FireScenarioList";
import FireSummaryCard from "./FireSummaryCard";

const DEFAULT_SCENARIO: FireScenario = {
  name: "My FIRE Plan",
  currentBalance: 50_000,
  monthlyContribution: 2_000,
  annualReturnRate: 0.07,
  annualInflationRate: 0.03,
  annualExpenses: 40_000,
  withdrawalRate: 0.04,
  targetFireNumber: null,
  projectionYears: 30,
};

export default function FireCalculator() {
  const currentCalendarYear = useMemo(() => new Date().getUTCFullYear(), []);
  const [scenarios, setScenarios] = useState<FireScenario[]>([]);
  const [current, setCurrent] = useState<FireScenario>({ ...DEFAULT_SCENARIO });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [retirementEntries, setRetirementEntries] = useState<RetirementEntry[]>(
    [],
  );
  const hasAttemptedInitialScenarioLoad = useRef(false);
  const hasUserInteracted = useRef(false);

  // Fetch saved scenarios on mount
  const fetchScenarios = useCallback(async () => {
    setLoadingScenarios(true);
    try {
      const res = await apiFetch("/api/fire");
      const data = await res.json();
      if (data.ok && Array.isArray(data.scenarios)) {
        setScenarios(data.scenarios);
      }
    } catch {
      // Silently fail — user may not be logged in or table not configured
    } finally {
      setLoadingScenarios(false);
    }
  }, []);

  useEffect(() => {
    void fetchScenarios();

    // Fetch retirement history for actual milestone overlay
    void (async () => {
      try {
        const res = await apiFetch("/api/progress/retirement");
        const data = await res.json();
        if (data.ok && Array.isArray(data.entries)) {
          setRetirementEntries(data.entries);
        }
      } catch {
        // Non-critical — chart still works without actual milestones
      }
    })();
  }, [fetchScenarios]);

  useEffect(() => {
    if (loadingScenarios || hasAttemptedInitialScenarioLoad.current) return;

    hasAttemptedInitialScenarioLoad.current = true;

    if (hasUserInteracted.current || current.scenarioId) return;

    const latestScenario = selectLatestFireScenario(scenarios);
    if (!latestScenario) return;

    setCurrent({ ...latestScenario });
    setError(null);
  }, [loadingScenarios, scenarios, current.scenarioId]);

  // Derive actual milestones the user has crossed (every $500K)
  const actualMilestones = useMemo(() => {
    if (retirementEntries.length === 0) return [];
    const sorted = [...retirementEntries].sort((a, b) => a.year - b.year);
    const maxAmount = Math.max(...sorted.map((e) => e.endAmount));
    const step = 1_000_000;
    const milestones: { year: number; amount: number }[] = [];
    for (let target = step; target <= maxAmount; target += step) {
      const entry = sorted.find((e) => e.endAmount >= target);
      if (entry) milestones.push({ year: entry.year, amount: target });
    }
    return milestones;
  }, [retirementEntries]);

  // Real-time projection calculation
  const computedFireNumber = useMemo(
    () => calculateFireNumber(current.annualExpenses, current.withdrawalRate),
    [current.annualExpenses, current.withdrawalRate],
  );

  const projection = useMemo(() => generateProjection(current), [current]);
  const historicalEstimateRows = useMemo(() => {
    const earliestHistoricalEntry = [...retirementEntries]
      .filter((entry) => entry.year < currentCalendarYear)
      .sort((left, right) => left.year - right.year)[0];

    if (!earliestHistoricalEntry) {
      return [];
    }

    const historicalYears = currentCalendarYear - earliestHistoricalEntry.year;
    if (historicalYears <= 0) {
      return [];
    }

    return generateProjection(
      {
        ...current,
        currentBalance: earliestHistoricalEntry.startAmount,
        projectionYears: historicalYears,
      },
      { startYear: earliestHistoricalEntry.year },
    ).rows;
  }, [current, currentCalendarYear, retirementEntries]);
  const chartRows = [...historicalEstimateRows, ...projection.rows];
  const breakdownRows = buildProjectionBreakdownRows({
    historicalEstimatedRows: historicalEstimateRows,
    futureProjectedRows: projection.rows,
    retirementEntries,
  });

  const handleFieldChange = useCallback(
    (field: string, value: string | number) => {
      hasUserInteracted.current = true;
      setCurrent((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSelectScenario = useCallback((s: FireScenario) => {
    hasUserInteracted.current = true;
    setCurrent({ ...s });
    setError(null);
  }, []);

  const handleNewScenario = useCallback(() => {
    hasUserInteracted.current = true;
    setCurrent({ ...DEFAULT_SCENARIO, name: "New Scenario" });
    setError(null);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const isEditing = Boolean(current.scenarioId);
      const method = isEditing ? "PUT" : "POST";
      const res = await apiFetch("/api/fire", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Failed to save scenario");
        return;
      }
      const saved = data.created ?? data.updated;
      if (saved) {
        setCurrent((prev) => ({ ...prev, scenarioId: saved.scenarioId }));
      }
      await fetchScenarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [current, fetchScenarios]);

  const handleDelete = useCallback(
    async (scenario: FireScenario) => {
      if (!scenario.scenarioId) return;
      const res = await apiFetch("/api/fire", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: scenario.scenarioId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Delete failed");

      if (current.scenarioId === scenario.scenarioId) {
        setCurrent({ ...DEFAULT_SCENARIO });
      }
      await fetchScenarios();
    },
    [current.scenarioId, fetchScenarios],
  );

  return (
    <Box>
      <PageHeader
        title="FIRE Calculator"
        description="Calculate your Financial Independence number and project how long it will take to reach your goal. Adjust the rate of return, monthly contributions, and inflation to compare scenarios."
        sx={{ mb: 3 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left column: Form + Scenarios */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5 }} elevation={1}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                Scenario Parameters
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : current.scenarioId ? "Update" : "Save"}
              </Button>
            </Stack>

            <FireForm
              values={current}
              onChange={handleFieldChange}
              computedFireNumber={computedFireNumber}
            />
          </Paper>

          <Paper sx={{ p: 2.5, mt: 2 }} elevation={1}>
            <FireScenarioList
              scenarios={scenarios}
              activeScenarioId={current.scenarioId}
              onSelect={handleSelectScenario}
              onNew={handleNewScenario}
              onDelete={handleDelete}
            />
          </Paper>
        </Grid>

        {/* Right column: Summary + Chart + Table */}
        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            <FireSummaryCard summary={projection.summary} />

            <Paper sx={{ p: 2.5 }} elevation={1}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Projection Over Time
              </Typography>
              <FireProjectionChart
                rows={chartRows}
                fireNumber={projection.summary.fireNumber}
                yearsToFire={projection.summary.yearsToFire}
                retirementHistory={retirementEntries}
                actualMilestones={actualMilestones}
                loading={loadingScenarios}
              />
              <Stack
                direction="row"
                spacing={2}
                justifyContent="center"
                sx={{ mt: 1, flexWrap: "wrap", rowGap: 1 }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Box
                    sx={{
                      width: 16,
                      height: 3,
                      bgcolor: SERVER_THEME_TOKENS.chart.palette[0],
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {FIRE_CHART_LABELS.projectedNominal}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Box
                    sx={{
                      width: 16,
                      height: 3,
                      bgcolor: "#66bb6a",
                      borderRadius: 1,
                      borderStyle: "dashed",
                      borderWidth: 1,
                      borderColor: "#66bb6a",
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {FIRE_CHART_LABELS.projectedReal}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Box
                    sx={{
                      width: 16,
                      height: 3,
                      bgcolor: "#ef5350",
                      borderRadius: 1,
                      borderStyle: "dashed",
                      borderWidth: 1,
                      borderColor: "#ef5350",
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {FIRE_CHART_LABELS.fireTarget}
                  </Typography>
                </Stack>
                {actualMilestones.length > 0 && (
                  <>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Box
                        sx={{
                          width: 16,
                          height: 3,
                          bgcolor: "#ff9800",
                          borderRadius: 1,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {FIRE_CHART_LABELS.actualBalance}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          bgcolor: "#ff9800",
                          borderRadius: "50%",
                          border: "2px solid #fff",
                          boxShadow: "0 0 0 1px #ff9800",
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {FIRE_CHART_LABELS.actualMilestone}
                      </Typography>
                    </Stack>
                  </>
                )}
              </Stack>
            </Paper>

            <Paper sx={{ p: 2.5 }} elevation={1}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Year-by-Year Breakdown
              </Typography>
              <FireProjectionTable rows={breakdownRows} />
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
