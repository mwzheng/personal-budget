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

function getLinkEndpointId(
  value: string | number | { id?: string | number },
): string {
  if (typeof value === "object" && value !== null && "id" in value) {
    return String(value.id ?? "");
  }

  return String(value);
}

function getSankeyLayoutMetrics(data: SankeyData) {
  const nodeIds = data.nodes.map((node) => node.id);
  const labels = data.nodes.map((node) => node.label ?? node.id);
  const indegree = new Map(nodeIds.map((id) => [id, 0]));
  const pendingIndegree = new Map(nodeIds.map((id) => [id, 0]));
  const outgoing = new Map(nodeIds.map((id) => [id, [] as string[]]));

  for (const link of data.links) {
    const sourceId = getLinkEndpointId(link.source);
    const targetId = getLinkEndpointId(link.target);

    outgoing.set(sourceId, [...(outgoing.get(sourceId) ?? []), targetId]);
    const nextIndegree = (indegree.get(targetId) ?? 0) + 1;
    indegree.set(targetId, nextIndegree);
    pendingIndegree.set(targetId, nextIndegree);
  }

  const queue = nodeIds.filter((id) => (indegree.get(id) ?? 0) === 0);
  const depth = new Map<string, number>(queue.map((id) => [id, 0]));

  while (queue.length > 0) {
    const nodeId = queue.shift();

    if (!nodeId) {
      continue;
    }

    for (const targetId of outgoing.get(nodeId) ?? []) {
      depth.set(
        targetId,
        Math.max(depth.get(targetId) ?? 0, (depth.get(nodeId) ?? 0) + 1),
      );
      pendingIndegree.set(targetId, (pendingIndegree.get(targetId) ?? 0) - 1);

      if ((pendingIndegree.get(targetId) ?? 0) === 0) {
        queue.push(targetId);
      }
    }
  }

  const layerCounts = new Map<number, number>();

  for (const nodeId of nodeIds) {
    const layer = depth.get(nodeId) ?? 0;
    layerCounts.set(layer, (layerCounts.get(layer) ?? 0) + 1);
  }

  const maxNodesInLayer = Math.max(1, ...Array.from(layerCounts.values()));
  const maxDepth = Math.max(
    1,
    ...Array.from(depth.values(), (value) => value + 1),
  );
  const maxLabelLength = Math.max(
    12,
    ...labels.map((label) => String(label).length),
  );

  // Default spacing based on density
  const defaultNodeSpacing =
    maxNodesInLayer >= 10 ? 48 : maxNodesInLayer >= 7 ? 36 : 28;

  // Compute a node thickness that scales with the largest link value so relative differences are visible.
  // Use a much larger multiplier and higher minimum so very small flows remain hoverable.
  // Also allow a much larger max and grow spacing/inner padding proportionally so layout expands rather than overlaps.
  const maxLinkValue = Math.max(
    1,
    ...data.links.map((l) => Number(l.value ?? 0)),
  );
  const baseThickness = Math.round(8 + Math.log10(maxLinkValue + 1) * 6);
  const nodeThickness = Math.min(
    1200,
    Math.max(28, Math.round(baseThickness * 15)),
  );

  // Inner padding between stacked subnodes should grow with thickness so links remain visible
  const nodeInnerPadding = Math.max(8, Math.round(nodeThickness / 4));

  // Ensure spacing is large enough to avoid overlap when nodes are thicker
  const nodeSpacing = Math.max(
    defaultNodeSpacing,
    Math.round(nodeThickness * 0.8),
  );

  // Estimate height with the new spacing so the chart can expand vertically when needed
  const height = Math.min(
    6000,
    Math.max(
      520,
      200 + maxNodesInLayer * nodeSpacing + Math.max(maxDepth - 2, 0) * 48,
    ),
  );

  // Reserve a reasonable right margin for labels without forcing the diagram to become narrow
  const rightMargin = Math.min(480, Math.max(140, 48 + maxLabelLength * 7));

  // Adjust label font size based on label length to improve readability
  const labelFontSize =
    maxLabelLength > 28 ? 11 : maxLabelLength > 20 ? 12 : 13;

  return {
    height,
    nodeSpacing,
    rightMargin,
    labelFontSize,
    nodeThickness,
    nodeInnerPadding,
  };
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
        linkOpacity={0.8}
        linkHoverOthersOpacity={0.12}
        enableLinkGradient
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={20}
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
              fontWeight: 700,
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
