/**
 * Note 1: SankeyChart is intentionally presentation-only. The parent computes a
 * fully grouped `{ nodes, links }` dataset so this component can focus on layout,
 * labels, and tooltip ergonomics without duplicating the budget math.
 */
"use client";

import { ResponsiveSankey } from "@nivo/sankey";
import { alpha, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useMemo, useState } from "react";

import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
import { ChartWrapper } from "@/components/charts/ChartWrapper";
import { getSankeyLayoutMetrics } from "@/lib/utils/sankey-layout";
import { formatCurrencyWhole } from "@/lib/utils/format";
import { SankeyData } from "@/lib/types/types";

interface Props {
  data: SankeyData;
}

const MAX_LABEL_CHARS = 18;

function truncateLabel(node: { label?: string }, maxChars: number) {
  const label = node.label ?? "";
  return label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label;
}

function getNodeColor(node: { id: string | number; color?: string }): string {
  return node.color ?? "#2D7DD2";
}

export function SankeyChart({ data }: Props) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const [expanded, setExpanded] = useState(false);
  const metrics = useMemo(() => getSankeyLayoutMetrics(data), [data]);
  const fullLabels = useMemo(
    () => new Map(data.nodes.map((node) => [node.id, node.label ?? node.id])),
    [data],
  );
  const labelOutlineColor = alpha(
    theme.palette.background.paper,
    theme.palette.mode === "dark" ? 0.94 : 0.96,
  );

  if (!data.nodes.length || !data.links.length) {
    return (
      <Stack
        sx={{
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          height: 300,
          gap: 1,
          p: { xs: 4, sm: 6 },
        }}
      >
        <Typography variant="h4" fontWeight={700} color="text.disabled">
          [Flow]
        </Typography>
        <Typography color="text.secondary">
          Add expenses and optional Sankey paths to generate the flow.
        </Typography>
      </Stack>
    );
  }

  const renderChart = () => (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <div
        style={{
          height: metrics.height,
          width: "100%",
        }}
      >
        <ResponsiveSankey
          data={data}
          margin={{
            top: 24,
            right: compact ? 85 : metrics.rightMargin,
            bottom: 24,
            left: compact ? 85 : metrics.leftMargin,
          }}
          align="justify"
          sort="input"
          label={
            ((node: { label?: string }) =>
              truncateLabel(node, compact ? 8 : MAX_LABEL_CHARS)) as never
          }
          colors={getNodeColor}
          valueFormat={formatCurrencyWhole}
          nodeOpacity={0.96}
          nodeThickness={metrics.nodeThickness}
          nodeInnerPadding={metrics.nodeInnerPadding}
          nodeSpacing={metrics.nodeSpacing}
          nodeBorderWidth={0}
          linkOpacity={0.72}
          linkHoverOpacity={0.94}
          linkHoverOthersOpacity={0.12}
          enableLinkGradient
          labelPosition="outside"
          labelOrientation="horizontal"
          labelPadding={10}
          labelTextColor={theme.palette.text.primary}
          nodeTooltip={({ node }) => (
            <ChartTooltipCard
              title={fullLabels.get(String(node.id)) ?? node.label}
              rows={[
                {
                  label: "Amount",
                  value: formatCurrencyWhole(Number(node.value ?? 0)),
                  color: getNodeColor(node),
                },
                ...(node.kind === "path"
                  ? [
                      {
                        label: "Branch",
                        value: "Intermediate path node",
                      },
                    ]
                  : []),
              ]}
            />
          )}
          linkTooltip={({ link }) => (
            <ChartTooltipCard
              title={`${fullLabels.get(String(link.source.id)) ?? link.source.label} -> ${fullLabels.get(String(link.target.id)) ?? link.target.label}`}
              rows={[
                {
                  label: "Flow",
                  value: formatCurrencyWhole(Number(link.value ?? 0)),
                  color: link.color,
                },
              ]}
            />
          )}
          theme={{
            text: {
              fill: theme.palette.text.primary,
              fontSize: compact ? 14 : metrics.labelFontSize,
              fontWeight: 700,
            },
            labels: {
              text: {
                fill: theme.palette.text.primary,
                fontSize: compact ? 14 : metrics.labelFontSize,
                fontWeight: 700,
                paintOrder: "stroke",
                stroke: labelOutlineColor,
                strokeWidth: 4,
                strokeLinejoin: "round",
                pointerEvents: "none",
              },
            },
            tooltip: {
              container: {
                background: "transparent",
                boxShadow: "none",
              },
            },
          }}
        />
      </div>
    </Box>
  );

  return (
    <Box sx={{ position: "relative", width: "100%", minWidth: 0 }}>
      <ChartWrapper title="Budget Flow">{renderChart()}</ChartWrapper>
      <Tooltip title="Expand chart">
        <IconButton
          size="small"
          aria-label="Expand Budget Flow chart"
          onClick={() => setExpanded(true)}
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
        onClose={() => setExpanded(false)}
        maxWidth="xl"
        fullWidth
        aria-labelledby="budget-flow-dialog-title"
      >
        <DialogTitle id="budget-flow-dialog-title" sx={{ pr: 7 }}>
          Budget Flow
          <IconButton
            aria-label="Close expanded chart"
            onClick={() => setExpanded(false)}
            sx={{ position: "absolute", right: 16, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>{renderChart()}</DialogContent>
      </Dialog>
    </Box>
  );
}
