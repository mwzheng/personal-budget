// Note 1: SankeyChart wraps the `@nivo/sankey` library. Nivo is a React data
// visualization library built on D3. It handles all the layout math (node
// placement, link bezier curves) and exposes the result as SVG. The component
// is only loaded client-side (`"use client"`) because D3 needs the browser DOM.
"use client";

import { ResponsiveSankey } from "@nivo/sankey";
import { SankeyData } from "@/lib/types";

// Note 2: CATEGORY_COLORS maps each budget category name to a hex color.
// These same colors are used across multiple components (SankeyChart, SankeyForm,
// SankeyPage) to maintain visual consistency without a centralized theme token.
const CATEGORY_COLORS: Record<string, string> = {
  Need: "#ef5350",
  Want: "#42a5f5",
  Saving: "#66bb6a",
};

function getNodeColor(node: { id: string | number }): string {
  // Note 3: The `?? "#2D7DD2"` fallback is the primary blue, used for nodes
  // that are not category nodes -- in this case "Income" or any custom label.
  return CATEGORY_COLORS[String(node.id)] ?? "#2D7DD2";
}

interface Props {
  data: SankeyData;
}

export function SankeyChart({ data }: Props) {
  if (!data.nodes.length || !data.links.length) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 40px",
          color: "#666",
          height: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ fontSize: 40 }}>📊</div>
        <div>Fill in the form to generate your budget Sankey diagram</div>
      </div>
    );
  }

  return (
    // Note 4: The outer `div` has a fixed height so the `ResponsiveSankey` can
    // fill 100% of it. Without a concrete pixel height the container collapses
    // to zero and the chart becomes invisible.
    <div style={{ height: 420 }}>
      <ResponsiveSankey
        data={data}
        margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
        // Note 5: `align="justify"` distributes nodes vertically so source nodes
        // are flush with the left edge and target nodes are flush with the right edge.
        align="justify"
        colors={getNodeColor}
        nodeOpacity={0.9}
        nodeThickness={22}
        nodeInnerPadding={3}
        nodeSpacing={24}
        nodeBorderWidth={0}
        nodeBorderColor={{ from: "color", modifiers: [["darker", 0.8]] }}
        linkOpacity={0.4}
        linkHoverOthersOpacity={0.1}
        enableLinkGradient
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={16}
        labelTextColor={{ from: "color", modifiers: [["brighter", 1]] }}
        theme={{
          text: { fill: "#ddd", fontSize: 13 },
          tooltip: {
            container: {
              background: "#242424",
              border: "1px solid #444",
              color: "#ddd",
            },
          },
        }}
      />
    </div>
  );
}
