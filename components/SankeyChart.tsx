"use client";

import { ResponsiveSankey } from "@nivo/sankey";
import { SankeyData } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  Need: "#ef5350",
  Want: "#42a5f5",
  Saving: "#66bb6a",
};

function getNodeColor(node: { id: string | number }): string {
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
    <div style={{ height: 420 }}>
      <ResponsiveSankey
        data={data}
        margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
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
