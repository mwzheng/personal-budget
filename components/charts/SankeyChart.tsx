/**
 * Note 1: SankeyChart is intentionally presentation-only. The parent computes a
 * fully grouped `{ nodes, links }` dataset so this component can focus on layout,
 * labels, and tooltip ergonomics without duplicating the budget math.
 */
"use client";

import { ResponsiveSankey } from "@nivo/sankey";

import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
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
  if (!data.nodes.length || !data.links.length) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "72px 40px",
          color: "#666",
          height: 460,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 700 }}>[Flow]</div>
        <div>Add expenses to generate the grouped Sankey flow.</div>
      </div>
    );
  }

  return (
    <div style={{ height: 520 }}>
      <ResponsiveSankey
        data={data}
        margin={{ top: 24, right: 220, bottom: 24, left: 56 }}
        align="justify"
        sort="input"
        label="label"
        colors={getNodeColor}
        valueFormat={formatCurrency}
        nodeOpacity={0.92}
        nodeThickness={18}
        nodeInnerPadding={4}
        nodeSpacing={20}
        nodeBorderWidth={0}
        linkOpacity={0.42}
        linkHoverOthersOpacity={0.08}
        enableLinkGradient
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={14}
        labelTextColor={{ from: "color", modifiers: [["darker", 2.2]] }}
        nodeTooltip={({ node }) => (
          <ChartTooltipCard
            title={node.label}
            rows={[
              {
                label: "Amount",
                value: formatCurrency(Number(node.value ?? 0)),
                color: getNodeColor(node),
              },
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
          text: { fill: "#111827", fontSize: 13, fontWeight: 600 },
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
