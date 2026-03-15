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
  const maxLabelLength = Math.max(12, ...labels.map((label) => label.length));

  return {
    height: Math.min(
      1400,
      Math.max(
        640,
        220 + maxNodesInLayer * 100 + Math.max(maxDepth - 2, 0) * 36,
      ),
    ),
    // Increase node spacing for dense layers so labels and nodes don't overlap
    nodeSpacing: maxNodesInLayer >= 10 ? 24 : maxNodesInLayer >= 7 ? 32 : 40,
    // Give extra right margin when labels are long so they don't collide with edges
    rightMargin: Math.min(420, Math.max(300, 72 + maxLabelLength * 8)),
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
    <div style={{ height: metrics.height }}>
      <ResponsiveSankey
        data={data}
        margin={{ top: 24, right: metrics.rightMargin, bottom: 24, left: 72 }}
        align="justify"
        sort="input"
        label="label"
        colors={getNodeColor}
        valueFormat={formatCurrency}
        nodeOpacity={0.96}
        nodeThickness={20}
        nodeInnerPadding={4}
        nodeSpacing={metrics.nodeSpacing}
        nodeBorderWidth={0}
        linkOpacity={0.52}
        linkHoverOthersOpacity={0.08}
        enableLinkGradient
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={18}
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
            fontSize: 14,
            fontWeight: 800,
          },
          labels: {
            text: {
              fill: theme.palette.text.primary,
              fontSize: 14,
              fontWeight: 800,
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
