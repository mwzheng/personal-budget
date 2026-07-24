"use client";

import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import {
  getLatestRetirementTotal,
  getLatestSalary,
} from "@/lib/progress/progress-summary";
import type {
  MilestoneEntry,
  RetirementEntry,
  SalaryEntry,
} from "@/lib/types/types";

interface Props {
  goalTargetAmount: number | null;
  latestEnd: number | null;
  salaryEntries: SalaryEntry[];
  retirementEntries: RetirementEntry[];
  milestones: MilestoneEntry[];
  onEditGoal: () => void;
  loading?: boolean;
}

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  backgroundColor: string;
  loading?: boolean;
}

const EMPTY = "—";

function formatAmount(value: number | null): string {
  return value === null ? EMPTY : `$${value.toLocaleString()}`;
}

function Stat({
  icon,
  label,
  value,
  color,
  backgroundColor,
  loading = false,
}: StatProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
      <Box
        aria-hidden="true"
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          color,
          bgcolor: backgroundColor,
          "& svg": { fontSize: 22 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        {loading ? (
          <Skeleton width={82} height={28} />
        ) : (
          <Typography variant="h6" fontWeight={700} lineHeight={1.2} noWrap>
            {value}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" noWrap>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

export default function GoalHero({
  goalTargetAmount,
  latestEnd,
  salaryEntries,
  retirementEntries,
  milestones,
  onEditGoal,
  loading = false,
}: Props) {
  const theme = useTheme();
  const totalSaved = latestEnd ?? getLatestRetirementTotal(retirementEntries);
  const latestSalary = getLatestSalary(salaryEntries);
  const yearsTracked = retirementEntries.length;
  const remaining =
    goalTargetAmount !== null && totalSaved !== null
      ? Math.max(goalTargetAmount - totalSaved, 0)
      : null;
  const nextMilestone = milestones
    .filter((milestone) => totalSaved === null || milestone.amount > totalSaved)
    .sort((left, right) => left.amount - right.amount)[0];
  const percentage =
    goalTargetAmount !== null && goalTargetAmount > 0 && totalSaved !== null
      ? Math.min(Math.max((totalSaved / goalTargetAmount) * 100, 0), 100)
      : null;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "minmax(0, 1.25fr) minmax(300px, .75fr)",
        },
        gap: 2.25,
      }}
    >
      <Card
        elevation={1}
        sx={{
          position: "relative",
          overflow: "hidden",
          bgcolor: "background.paper",
          "&::after": {
            content: '""',
            position: "absolute",
            width: 240,
            height: 240,
            right: -70,
            top: -100,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            borderRadius: "50%",
            pointerEvents: "none",
          },
        }}
      >
        <CardContent
          sx={{
            p: { xs: 2.5, sm: 3 },
            "&:last-child": { pb: { xs: 2.5, sm: 3 } },
          }}
        >
          <Typography
            variant="overline"
            color="primary.light"
            fontWeight={700}
            letterSpacing="0.1em"
          >
            Primary goal · Financial progress
          </Typography>
          <Typography
            component="h2"
            variant="h4"
            fontWeight={700}
            sx={{ mt: 0.5 }}
          >
            {goalTargetAmount !== null
              ? `${formatAmount(goalTargetAmount)} savings target`
              : "Set your financial goal"}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Keep building the habit. Your progress and history are tracked here.
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 2,
              mt: 4,
              mb: 1,
            }}
          >
            <Box>
              <Typography variant="h3" fontWeight={800} lineHeight={1}>
                {formatAmount(totalSaved)}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                saved so far
              </Typography>
            </Box>
            <Typography color="primary.light" fontWeight={700}>
              {percentage !== null
                ? `${percentage.toFixed(0)}% complete`
                : "Not started"}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={percentage ?? 0}
            aria-label="Financial goal progress"
            sx={{
              height: 10,
              borderRadius: 999,
              bgcolor: alpha(theme.palette.primary.main, 0.14),
              "& .MuiLinearProgress-bar": { borderRadius: 999 },
            }}
          />

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: 2, sm: 3 },
              mt: 2,
            }}
          >
            <Box>
              <Typography fontWeight={700}>
                {formatAmount(remaining)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                remaining
              </Typography>
            </Box>
            <Box>
              <Typography fontWeight={700}>{yearsTracked || EMPTY}</Typography>
              <Typography variant="body2" color="text.secondary">
                years tracked
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={onEditGoal}
              sx={{ ml: { sm: "auto" }, alignSelf: "center" }}
            >
              {goalTargetAmount === null ? "Set goal" : "Edit goal"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card
        elevation={1}
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <CardContent
          sx={{
            p: { xs: 2.5, sm: 3 },
            flex: 1,
            display: "flex",
            flexDirection: "column",
            "&:last-child": { pb: { xs: 2.5, sm: 3 } },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2.5,
            }}
          >
            <Typography component="h2" variant="h6" fontWeight={600}>
              At a glance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overview
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gridTemplateRows: { xs: "auto", sm: "repeat(2, minmax(0, 1fr))" },
              alignItems: "center",
              alignContent: "stretch",
              gap: { xs: 2.5, sm: 3 },
            }}
          >
            <Stat
              icon={<SavingsOutlinedIcon />}
              label="Total saved"
              value={formatAmount(totalSaved)}
              color={theme.palette.primary.light}
              backgroundColor={alpha(theme.palette.primary.main, 0.14)}
              loading={loading}
            />
            <Stat
              icon={<TrendingUpOutlinedIcon />}
              label="Latest salary"
              value={formatAmount(latestSalary)}
              color={theme.palette.warning.main}
              backgroundColor={alpha(theme.palette.warning.main, 0.14)}
              loading={loading}
            />
            <Stat
              icon={<CalendarMonthOutlinedIcon />}
              label="Years tracked"
              value={yearsTracked ? String(yearsTracked) : EMPTY}
              color={theme.palette.info.main}
              backgroundColor={alpha(theme.palette.info.main, 0.14)}
              loading={loading}
            />
            <Stat
              icon={<FlagOutlinedIcon />}
              label="Next milestone"
              value={formatAmount(nextMilestone?.amount ?? null)}
              color={theme.palette.secondary.main}
              backgroundColor={alpha(theme.palette.secondary.main, 0.14)}
              loading={loading}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
