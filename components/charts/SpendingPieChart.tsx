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
import { ChartLegend } from "@/components/charts/ChartLegend";
import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";

const COLORS: Record<string, string> = {
  Need: "#ef5350",
  Want: "#42a5f5",
  Saving: "#66bb6a",
};

interface Props {
  data: { Need: number; Want: number; Saving: number };
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
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
      <PieChart margin={{ top: 16, right: 32, bottom: 48, left: 32 }}>
        {/* Note 5: Outside labels need extra breathing room on small cards, so the
            pie uses a slightly smaller radius and more chart margin than the
            Recharts defaults. Moving the center upward also leaves a clean lane
            for the legend at the bottom. */}
        {/* Note 4: `innerRadius={50}` turns the pie into a donut chart.
            The empty center can be used to show a total label in future iterations.
            `paddingAngle={2}` adds a small gap between slices for readability. */}
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="44%"
          outerRadius={86}
          innerRadius={48}
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
          content={({ active, payload }) => {
            if (!active || !payload?.length) {
              return null;
            }

            const entry = payload[0];

            return (
              <ChartTooltipCard
                title={String(entry.name ?? entry.payload?.name ?? "Category")}
                rows={[
                  {
                    label: "Amount",
                    value: formatCurrency(Number(entry.value ?? 0)),
                    color: entry.color,
                  },
                ]}
              />
            );
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={40}
          content={({ payload }) => (
            <ChartLegend payload={payload} gap={2.5} justifyContent="center" />
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
