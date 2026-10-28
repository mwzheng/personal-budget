"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Skeleton,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  computeGoalProgress,
  getLatestRetirementTotal,
} from "@/lib/progress/progress-summary";
import type { MilestoneEntry, RetirementEntry } from "@/lib/types/types";

interface Props {
  goalTargetAmount: number | null;
  retirementEntries: RetirementEntry[];
  milestones: MilestoneEntry[];
  onEditGoal: () => void;
  onAddMilestone: () => void;
  loading?: boolean;
}

const formatAmount = (value: number) => `$${value.toLocaleString()}`;

export default function GoalHero({
  goalTargetAmount,
  retirementEntries,
  milestones,
  onEditGoal,
  onAddMilestone,
  loading = false,
}: Props) {
  const entries = [...retirementEntries].sort((a, b) => b.year - a.year);
  const latest = entries[0];
  const previous = entries[1];
  const totalSaved = getLatestRetirementTotal(retirementEntries);
  const { rawPct, clampedPct } = computeGoalProgress(
    totalSaved,
    goalTargetAmount,
  );
  const reached =
    totalSaved !== null &&
    goalTargetAmount !== null &&
    totalSaved >= goalTargetAmount;
  const nextMilestone =
    totalSaved === null
      ? undefined
      : milestones
          .filter((m) => m.amount > totalSaved)
          .sort((a, b) => a.amount - b.amount)[0];
  const change =
    latest && previous ? latest.endAmount - previous.endAmount : null;

  return (
    <Card elevation={1} sx={{ overflow: "hidden" }}>
      <CardContent
        sx={{
          p: { xs: 2.5, md: 4 },
          "&:last-child": { pb: { xs: 2.5, md: 4 } },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography
              variant="overline"
              color="primary.main"
              fontWeight={700}
              letterSpacing="0.1em"
            >
              Retirement savings
            </Typography>
            <Typography component="h2" variant="h5" fontWeight={700}>
              Your Savings Goal
            </Typography>
          </Box>
          <Button variant="outlined" onClick={onEditGoal}>
            {goalTargetAmount === null ? "Set goal" : "Edit goal"}
          </Button>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1.3fr) minmax(240px, 0.7fr)",
            },
            gap: { xs: 3, md: 5 },
            mt: 3,
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              {latest ? `${latest.year} balance` : "Latest recorded balance"}
            </Typography>
            {loading && totalSaved === null ? (
              <Skeleton width={180} height={55} />
            ) : (
              <Typography
                variant="h3"
                fontWeight={700}
                sx={{ mt: 0.5, overflowWrap: "anywhere" }}
              >
                {totalSaved === null ? "—" : formatAmount(totalSaved)}
              </Typography>
            )}
            {change !== null && latest && previous && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {change > 0 ? "+" : change < 0 ? "−" : ""}
                {formatAmount(Math.abs(change))} from {previous.year} to{" "}
                {latest.year}
              </Typography>
            )}
            {totalSaved === null && !loading && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Add a retirement balance to track your progress.
                </Typography>
                <Button href="#retirement-history" size="small" sx={{ px: 0 }}>
                  Add retirement entry
                </Button>
              </Box>
            )}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                mt: 3,
                mb: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {reached
                  ? "Goal reached"
                  : goalTargetAmount === null
                    ? "Set a goal to track your progress"
                    : totalSaved === null
                      ? "Add a balance to track your progress"
                      : "Progress toward your goal"}
              </Typography>
              {rawPct !== null && (
                <Typography
                  variant="body2"
                  color="primary.main"
                  fontWeight={700}
                >
                  {Number(rawPct.toFixed(2))}%
                </Typography>
              )}
            </Box>
            {clampedPct !== null && (
              <LinearProgress
                variant="determinate"
                value={clampedPct}
                aria-label="Savings goal progress"
                sx={{
                  height: 10,
                  borderRadius: 99,
                  "& .MuiLinearProgress-bar": { borderRadius: 99 },
                }}
              />
            )}
          </Box>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.07),
              display: "grid",
              gap: 2,
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
            >
              <Typography color="text.secondary">Goal</Typography>
              <Typography fontWeight={700}>
                {goalTargetAmount === null
                  ? "—"
                  : formatAmount(goalTargetAmount)}
              </Typography>
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
            >
              <Typography color="text.secondary">
                {reached ? "Above goal" : "Remaining"}
              </Typography>
              <Typography fontWeight={700}>
                {goalTargetAmount === null || totalSaved === null
                  ? "—"
                  : formatAmount(Math.abs(goalTargetAmount - totalSaved))}
              </Typography>
            </Box>
            <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Next milestone
              </Typography>
              {nextMilestone ? (
                <>
                  <Typography variant="h6" fontWeight={700}>
                    {formatAmount(nextMilestone.amount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatAmount(nextMilestone.amount - totalSaved!)} to go
                  </Typography>
                </>
              ) : milestones.length === 0 ? (
                <>
                  <Typography fontWeight={600}>No milestones yet</Typography>
                  <Button size="small" onClick={onAddMilestone} sx={{ px: 0 }}>
                    Add milestone
                  </Button>
                </>
              ) : totalSaved === null ? (
                <Typography fontWeight={600}>
                  Add a balance to see your next milestone
                </Typography>
              ) : (
                <Typography fontWeight={600}>All milestones reached</Typography>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
