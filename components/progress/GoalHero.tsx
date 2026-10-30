"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
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
  loading?: boolean;
}

const formatAmount = (value: number) => `$${value.toLocaleString()}`;

export default function GoalHero({
  goalTargetAmount,
  retirementEntries,
  milestones,
  onEditGoal,
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
          .filter(
            (m) =>
              m.kind !== "achievement" &&
              !milestones.some(
                (a) => a.kind === "achievement" && a.amount === m.amount,
              ) &&
              m.amount > totalSaved,
          )
          .sort((a, b) => a.amount - b.amount)[0];
  const change =
    latest && previous ? latest.endAmount - previous.endAmount : null;

  return (
    <Card elevation={1} sx={{ overflow: "hidden" }}>
      <CardContent
        sx={{
          p: { xs: 2.5, md: 3 },
          "&:last-child": { pb: { xs: 2.5, md: 3 } },
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
          <Typography component="h2" variant="h5" fontWeight={700}>
            Savings Goal
          </Typography>
          <Button variant="outlined" onClick={onEditGoal}>
            {goalTargetAmount === null ? "Set Goal" : "Edit Goal"}
          </Button>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1fr) minmax(260px, 1fr)",
            },
            gap: { xs: 2, md: 3 },
            mt: 2,
            alignItems: "center",
          }}
        >
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1.5, sm: 3 },
                minWidth: 0,
              }}
            >
              <Box
                component="svg"
                viewBox="0 0 100 100"
                aria-hidden="true"
                sx={{
                  width: { xs: 88, sm: 140 },
                  flexShrink: 0,
                  color: "primary.main",
                }}
              >
                <defs>
                  <clipPath id="savings-bowl">
                    <path d="M18 45h64c-2 21-14 32-32 32S20 66 18 45Z" />
                  </clipPath>
                </defs>
                {clampedPct !== null && (
                  <rect
                    x="18"
                    y={77 - clampedPct * 0.32}
                    width="64"
                    height={clampedPct * 0.32}
                    fill="currentColor"
                    opacity="0.28"
                    clipPath="url(#savings-bowl)"
                  />
                )}
                <path
                  d="M18 45h64c-2 21-14 32-32 32S20 66 18 45Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeLinejoin="round"
                />
                <path
                  d="M30 37l12-10 10 6 17-14M59 19h10v10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary">
                  {latest
                    ? `${latest.year} year-end balance`
                    : "Latest recorded balance"}
                </Typography>
                {loading && totalSaved === null ? (
                  <Skeleton width={180} height={55} />
                ) : (
                  <Typography
                    variant="h3"
                    fontWeight={700}
                    sx={{
                      mt: 0.5,
                      fontSize: { xs: "2rem", sm: "3rem" },
                      overflowWrap: "anywhere",
                    }}
                  >
                    {totalSaved === null ? "—" : formatAmount(totalSaved)}
                  </Typography>
                )}
                {change !== null && latest && previous && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
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
                  </Box>
                )}
                {rawPct !== null && (
                  <Typography
                    variant="body2"
                    color="primary.main"
                    fontWeight={700}
                    sx={{ mt: 1 }}
                  >
                    {Number(rawPct.toFixed(2))}% of goal
                    {reached ? " · Goal reached" : ""}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.07),
              display: "grid",
              gap: 1,
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
            <Box sx={{ borderTop: 1, borderColor: "divider", pt: 1 }}>
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
                </>
              ) : totalSaved === null ? (
                <Typography fontWeight={600}>
                  Add a balance to see your next milestone
                </Typography>
              ) : milestones.some(
                  (m) =>
                    m.kind === "target" &&
                    totalSaved !== null &&
                    m.amount <= totalSaved &&
                    !milestones.some(
                      (a) => a.kind === "achievement" && a.amount === m.amount,
                    ),
                ) ? (
                <Typography fontWeight={600}>
                  Record when you reached your target
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
