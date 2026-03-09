// Note 1: SpendingPieChart visualizes the Need/Want/Saving budget split as a
// donut chart using Recharts. It is lazily loaded (see reports/page.tsx) because
// Recharts bundles D3 internals that add ~40KB to the initial JS load.
"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS: Record<string, string> = {
  Need: "#ef5350",
  Want: "#42a5f5",
  Saving: "#66bb6a",
};

interface Props {
  data: { Need: number; Want: number; Saving: number };
}

export function SpendingPieChart({ data }: Props) {
  // Note 2: Filtering out zero-value entries prevents Recharts from rendering
  // invisible slices that still show up in the legend and tooltip, which would
  // be confusing for the user when only one or two categories have data.
  const chartData = [
    { name: "Need", value: data.Need },
    { name: "Want", value: data.Want },
    { name: "Saving", value: data.Saving },
  ].filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div
        style={{ textAlign: "center", padding: 40, color: "#666", height: 280 }}
      >
        No data for selected filters
      </div>
    );
  }

  return (
    // Note 3: `ResponsiveContainer` makes the chart fill its parent element's
    // width. Setting `height` here gives the SVG a fixed pixel height, keeping
    // the chart a consistent size across different screen widths.
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        {/* Note 4: `innerRadius={50}` turns the pie into a donut chart.
            The empty center can be used to show a total label in future iterations.
            `paddingAngle={2}` adds a small gap between slices for readability. */}
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={50}
          paddingAngle={2}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [
            `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            "",
          ]}
          contentStyle={{ background: "#242424", border: "1px solid #444" }}
          labelStyle={{ color: "#fff" }}
          itemStyle={{ color: "#fff" }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
