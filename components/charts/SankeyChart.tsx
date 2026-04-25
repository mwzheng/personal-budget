/**
 * Note 1: SankeyChart is intentionally presentation-only. The parent computes a
 * fully grouped `{ nodes, links }` dataset so this component can focus on layout,
 * labels, and tooltip ergonomics without duplicating the budget math.
 */
"use client";

import { ResponsiveSankey } from "@nivo/sankey";
import { alpha, useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";

import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
import { ChartWrapper } from "@/components/charts/ChartWrapper";
import { getSankeyLayoutMetrics } from "@/lib/utils/sankey-layout";
import { formatCurrencyWhole } from "@/lib/utils/format";
import { SankeyData } from "@/lib/types/types";

interface Props {
  data: SankeyData;
}

function getNodeColor(node: { id: string | number; color?: string }): string {
  return node.color ?? "#2D7DD2";
}

export function SankeyChart({ data }: Props) {
  const theme = useTheme();
  const metrics = useMemo(() => getSankeyLayoutMetrics(data), [data]);
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
          height: 460,
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

  return (
    <ChartWrapper title="Budget Flow">
      <div
        style={{
          height: metrics.height,
          width: "100%",
          maxWidth: metrics.chartMaxWidth,
          margin: "0 auto",
        }}
      >
        <ResponsiveSankey
          data={data}
          margin={{
            top: 24,
            right: metrics.rightMargin,
            bottom: 24,
            left: metrics.leftMargin,
          }}
          align="justify"
          sort="input"
          label="label"
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
          labelPadding={16}
          nodeTooltip={({ node }) => (
            <ChartTooltipCard
              title={node.label}
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
              title={`${link.source.label} -> ${link.target.label}`}
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
              fontSize: metrics.labelFontSize,
              fontWeight: 700,
            },
            labels: {
              text: {
                fill: theme.palette.text.primary,
                fontSize: metrics.labelFontSize,
                fontWeight: 800,
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
    </ChartWrapper>
  );
}
