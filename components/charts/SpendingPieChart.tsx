// Note 1: SpendingPieChart visualizes the Need/Want/Saving budget split as a
// donut chart using Recharts. It is lazily loaded (see reports/page.tsx) because
// Recharts bundles D3 internals that add ~40KB to the initial JS load.
"use client";

import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { ChartWrapper } from "@/components/charts/ChartWrapper";
import {
  CATEGORY_HEX_COLORS,
  TAG_CHART_PALETTE,
} from "@/lib/utils/categoryColors";
import { formatCurrency } from "@/lib/utils/format";

interface Props {
  data: { Need: number; Want: number; Saving: number };
  tags?: { name: string; value: number }[];
  mode?: "category" | "tag";
}

export function SpendingPieChart({
  data,
  tags = [],
  mode = "category",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<{
    name: string;
    mode: "category" | "tag";
  } | null>(null);
  const chartData = (
    mode === "tag"
      ? tags
      : [
          { name: "Need", value: data.Need },
          { name: "Want", value: data.Want },
          { name: "Saving", value: data.Saving },
        ]
  ).filter((entry) => entry.value > 0);
  const colorFor = (name: string, index: number) =>
    mode === "tag"
      ? TAG_CHART_PALETTE[index % TAG_CHART_PALETTE.length]
      : CATEGORY_HEX_COLORS[name as keyof typeof CATEGORY_HEX_COLORS];
  const legendEntries = chartData
    .map((entry, index) => ({ ...entry, color: colorFor(entry.name, index) }))
    .sort((a, b) => b.value - a.value);
  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);
  const selected =
    active?.mode === mode
      ? chartData.find((entry) => entry.name === active.name)
      : undefined;

  if (chartData.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 5,
          px: 2,
          height: 280,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
        }}
      >
        {mode === "tag"
          ? "No tag data for selected filters"
          : "No data for selected filters"}
      </Box>
    );
  }

  const renderChart = (large: boolean) => (
    <Box sx={{ height: "100%" }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: large
            ? { xs: "min(55vh, 420px)", sm: "min(70vh, 720px)" }
            : { xs: 260, md: 340 },
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 12, right: 16, bottom: 12, left: 16 }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="90%"
              innerRadius="65%"
              paddingAngle={2}
              animationDuration={1200}
              animationEasing="ease-out"
              animationBegin={200}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={colorFor(entry.name, index)}
                  tabIndex={0}
                  role="img"
                  aria-label={`${entry.name}: ${formatCurrency(entry.value)}, ${((entry.value / total) * 100).toFixed(1)}%`}
                  onMouseEnter={() => setActive({ name: entry.name, mode })}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive({ name: entry.name, mode })}
                  onBlur={() => setActive(null)}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <Box
          aria-live="polite"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(55%, 174px)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          {selected && (
            <Typography
              variant="caption"
              component="div"
              sx={{
                fontWeight: 650,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selected.name}
            </Typography>
          )}
          <Typography
            component="div"
            sx={{
              fontWeight: 650,
              fontSize: selected ? "0.9rem" : "1.1rem",
              overflowWrap: "anywhere",
              lineHeight: 1.2,
            }}
          >
            {formatCurrency(selected?.value ?? total)}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div">
            {selected
              ? `${((selected.value / total) * 100).toFixed(1)}% of ${mode === "tag" ? "tagged" : "spending"}`
              : mode === "tag"
                ? "tagged"
                : "spent"}
          </Typography>
        </Box>
      </Box>
      <Box
        component="ul"
        aria-label="Top breakdown categories"
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignContent: "flex-start",
          columnGap: 2,
          listStyle: "none",
          m: 0,
          mt: 1,
          p: 0,
          height: large ? "auto" : 72,
          overflow: large ? "visible" : "hidden",
        }}
      >
        {legendEntries.map((entry) => (
          <Box
            component="li"
            key={entry.name}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              height: 24,
              minWidth: 0,
              maxWidth: "100%",
            }}
          >
            <Box
              component="span"
              sx={{
                width: 10,
                height: 10,
                flexShrink: 0,
                borderRadius: "50%",
                bgcolor: entry.color,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "text.secondary",
              }}
            >
              {entry.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{ position: "relative", width: "100%", minWidth: 0, height: "100%" }}
    >
      <ChartWrapper title="Spending Breakdown">
        {renderChart(false)}
      </ChartWrapper>
      <Tooltip title="Expand chart">
        <IconButton
          size="small"
          aria-label="Expand Spending Breakdown chart"
          onClick={() => {
            setActive(null);
            setExpanded(true);
          }}
          sx={{
            position: "absolute",
            top: 4,
            right: 40,
            bgcolor: "background.paper",
            color: "text.secondary",
          }}
        >
          <OpenInFullIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Dialog
        open={expanded}
        onClose={() => {
          setExpanded(false);
          setActive(null);
        }}
        maxWidth="xl"
        fullWidth
        aria-labelledby="spending-breakdown-dialog-title"
      >
        <DialogTitle id="spending-breakdown-dialog-title" sx={{ pr: 7 }}>
          Spending Breakdown
          <IconButton
            aria-label="Close expanded chart"
            onClick={() => {
              setExpanded(false);
              setActive(null);
            }}
            sx={{ position: "absolute", right: 16, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>{renderChart(true)}</DialogContent>
      </Dialog>
    </Box>
  );
}
