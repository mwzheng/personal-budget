"use client";

import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import GoalGauge from "@/components/progress/GoalGauge";
import { ActionIconButton } from "@/components/ui/ActionIconButton";
import {
  getLatestRetirementTotal,
  getLatestSalary,
} from "@/lib/progress/progress-summary";
import type { RetirementEntry, SalaryEntry } from "@/lib/types/types";

interface Props {
  goalTargetAmount: number | null;
  latestEnd: number | null;
  salaryEntries: SalaryEntry[];
  retirementEntries: RetirementEntry[];
  onEditGoal: () => void;
  loading?: boolean;
}

interface MiniStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconColor: string;
  iconBgColor: string;
}

function MiniStat({
  icon,
  label,
  value,
  iconColor,
  iconBgColor,
  loading,
}: MiniStatProps & { loading?: boolean }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        aria-hidden="true"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          bgcolor: iconBgColor,
          color: iconColor,
          flexShrink: 0,
          "& svg": { fontSize: 22 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        {loading ? (
          <Skeleton width={80} height={24} />
        ) : (
          <Typography variant="h6" fontWeight={700} lineHeight={1.2} noWrap>
            {value}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.15 }}>
          {label}
        </Typography>
      </Box>
    </Stack>
  );
}

const EMPTY = "—";

function fmt(n: number | null): string {
  if (n === null) return EMPTY;
  return `$${n.toLocaleString()}`;
}

export default function GoalHero({
  goalTargetAmount,
  latestEnd,
  salaryEntries,
  retirementEntries,
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

  return (
    <Card elevation={1}>
      <CardContent
        sx={{
          p: { xs: 2.5, sm: 3 },
          "&:last-child": { pb: { xs: 2.5, sm: 3 } },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={4}
          alignItems={{ xs: "center", md: "flex-start" }}
        >
          {/* Left: Gauge + motivational text */}
          <Box sx={{ flexShrink: 0, textAlign: "center" }}>
            <Box sx={{ position: "relative" }}>
              <GoalGauge current={latestEnd} target={goalTargetAmount} />
              <ActionIconButton
                tooltip="Edit goal"
                ariaLabel="Edit goal"
                onClick={onEditGoal}
                sx={{
                  position: "absolute",
                  top: 0,
                  right: -8,
                  bgcolor: "background.paper",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </ActionIconButton>
            </Box>

            {goalTargetAmount !== null && totalSaved !== null ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, maxWidth: 240, mx: "auto" }}
              >
                You&apos;ve saved <strong>{fmt(totalSaved)}</strong> toward your{" "}
                <strong>{fmt(goalTargetAmount)}</strong> goal
              </Typography>
            ) : goalTargetAmount !== null ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Target: <strong>{fmt(goalTargetAmount)}</strong>
              </Typography>
            ) : (
              <Button
                variant="contained"
                size="small"
                onClick={onEditGoal}
                sx={{ mt: 1.5 }}
              >
                Set Goal
              </Button>
            )}
          </Box>

          {/* Right: Mini stats grid */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 3,
            }}
          >
            <MiniStat
              icon={<SavingsOutlinedIcon />}
              label="Total Saved"
              value={fmt(totalSaved)}
              iconColor={theme.palette.success.main}
              iconBgColor={alpha(theme.palette.success.main, 0.15)}
              loading={loading}
            />
            <MiniStat
              icon={<TrendingUpOutlinedIcon />}
              label="Latest Salary"
              value={fmt(latestSalary)}
              iconColor={theme.palette.warning.main}
              iconBgColor={alpha(theme.palette.warning.main, 0.15)}
              loading={loading}
            />
            <MiniStat
              icon={<CalendarMonthOutlinedIcon />}
              label="Years Tracked"
              value={yearsTracked > 0 ? String(yearsTracked) : EMPTY}
              iconColor={theme.palette.info.main}
              iconBgColor={alpha(theme.palette.info.main, 0.15)}
              loading={loading}
            />
            <MiniStat
              icon={<FlagOutlinedIcon />}
              label="Remaining"
              value={remaining !== null ? fmt(remaining) : EMPTY}
              iconColor={theme.palette.primary.main}
              iconBgColor={alpha(theme.palette.primary.main, 0.15)}
              loading={loading}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
