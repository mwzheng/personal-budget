/**
 * Note 1: SankeyChart is intentionally presentation-only. The parent computes a
 * fully grouped `{ nodes, links }` dataset so this component can focus on layout,
 * labels, and tooltip ergonomics without duplicating the budget math.
 */
"use client";

import { ResponsiveSankey } from "@nivo/sankey";
import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";

import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
import { getSankeyLayoutMetrics } from "@/lib/sankey-layout";
import { SankeyData } from "@/lib/types";

interface Props {
  data: SankeyData;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function getNodeColor(node: { id: string | number; color?: string }): string {
  return node.color ?? "#2D7DD2";
}

export function SankeyChart({ data }: Props) {
  const theme = useTheme();
  const metrics = useMemo(() => getSankeyLayoutMetrics(data), [data]);

  if (!data.nodes.length || !data.links.length) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "72px 40px",
          color: theme.palette.text.secondary,
          height: 460,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 700 }}>[Flow]</div>
        <div>Add expenses and optional Sankey paths to generate the flow.</div>
      </div>
    );
  }

  return (
    <div style={{ height: metrics.height, width: "100%" }}>
      <ResponsiveSankey
        data={data}
        margin={{ top: 24, right: metrics.rightMargin, bottom: 24, left: 48 }}
        align="justify"
        sort="input"
        label="label"
        colors={getNodeColor}
        valueFormat={formatCurrency}
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
                value: formatCurrency(Number(node.value ?? 0)),
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
                value: formatCurrency(Number(link.value ?? 0)),
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
              stroke: theme.palette.background.paper,
              strokeWidth: 3,
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
  );
}
