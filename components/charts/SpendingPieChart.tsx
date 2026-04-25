// Note 1: SpendingPieChart visualizes the Need/Want/Saving budget split as a
// donut chart using Recharts. It is lazily loaded (see reports/page.tsx) because
// Recharts bundles D3 internals that add ~40KB to the initial JS load.
"use client";

import Box from "@mui/material/Box";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartLegend } from "@/components/charts/ChartLegend";
import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
import { ChartWrapper } from "@/components/charts/ChartWrapper";
import { CATEGORY_HEX_COLORS } from "@/lib/utils/categoryColors";
import { formatCurrency } from "@/lib/utils/format";

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
  ].filter((entry) => entry.value > 0);
  const legendPayload = chartData.map((entry) => ({
    value: entry.name,
    color: CATEGORY_HEX_COLORS[entry.name as keyof typeof CATEGORY_HEX_COLORS],
  }));

  if (chartData.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 5,
          px: 2,
          height: 280,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
        }}
      >
        No data for selected filters
      </Box>
    );
  }

  return (
    <ChartWrapper title="Spending Breakdown">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          height: "100%",
        }}
      >
        {/* Note 3: The plot area and legend are laid out independently so the pie
            can stay visually centered inside the card instead of being nudged upward
            to make room for the legend inside the SVG. */}
        <Box
          sx={{
            width: "100%",
            minHeight: 340,
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 12, right: 16, bottom: 12, left: 16 }}>
              {/* Note 4: `innerRadius={50}` turns the pie into a donut chart.
                  The empty center can be used to show a total label in future
                  iterations. `paddingAngle={2}` adds a small gap between slices
                  for readability. */}
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={108}
                innerRadius={64}
                paddingAngle={2}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={200}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={
                      CATEGORY_HEX_COLORS[
                        entry.name as keyof typeof CATEGORY_HEX_COLORS
                      ]
                    }
                  />
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
                      title={String(
                        entry.name ?? entry.payload?.name ?? "Category",
                      )}
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
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <ChartLegend
          payload={legendPayload}
          gap={2.5}
          justifyContent="center"
        />
      </Box>
    </ChartWrapper>
  );
}
