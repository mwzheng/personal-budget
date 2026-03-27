import { SankeyData } from "../types/types";

export interface SankeyLayoutMetrics {
  height: number;
  nodeSpacing: number;
  leftMargin: number;
  rightMargin: number;
  chartMaxWidth: number;
  labelFontSize: number;
  nodeThickness: number;
  nodeInnerPadding: number;
}

function getLinkEndpointId(
  value: string | number | { id?: string | number },
): string {
  if (typeof value === "object" && value !== null && "id" in value) {
    return String(value.id ?? "");
  }

  return String(value);
}

export function getSankeyLayoutMetrics(data: SankeyData): SankeyLayoutMetrics {
  /**
   * Note 1: In Nivo, `nodeThickness` controls the horizontal bar width of a
   * node, not the thickness of the flow bands. The visual weight of links comes
   * mostly from overall chart height and `nodeSpacing`, so we keep node bars
   * bounded and tune the layout with compact padding instead of runaway scaling.
   */
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

  const nodeThickness = maxDepth >= 5 ? 12 : maxDepth >= 4 ? 14 : 16;
  const nodeSpacing =
    maxNodesInLayer >= 12 ? 10 : maxNodesInLayer >= 8 ? 14 : 18;
  const nodeInnerPadding = 0;
  // Note 2: Increased height multiplier to make flow bands thicker and easier to hover over.
  // Changed from 40 to 60 per node, and base from 180 to 240, allowing max height of 1200.
  const height = Math.min(
    1200,
    Math.max(540, 240 + maxNodesInLayer * 60 + Math.max(maxDepth - 3, 0) * 32),
  );
  /**
   * Note 3: Outside labels naturally pull the chart's visual weight to the
   * right. We keep a healthy right margin for readable labels, but add a
   * smaller balancing left margin and a centered max width so the graph still
   * feels centered inside the card on wider viewports.
   */
  const rightMargin = Math.min(320, Math.max(132, 76 + maxLabelLength * 6));
  const leftMargin = Math.min(
    164,
    Math.max(56, Math.round(rightMargin * (maxDepth >= 4 ? 0.5 : 0.42))),
  );
  const chartMaxWidth = Math.min(
    1360,
    Math.max(900, 760 + maxDepth * 120 + maxLabelLength * 6),
  );
  const labelFontSize =
    maxLabelLength > 28 ? 11 : maxLabelLength > 20 ? 12 : 13;

  return {
    height,
    nodeSpacing,
    leftMargin,
    rightMargin,
    chartMaxWidth,
    labelFontSize,
    nodeThickness,
    nodeInnerPadding,
  };
}
