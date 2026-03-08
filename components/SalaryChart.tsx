"use client";
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
} from "recharts";

export default function SalaryChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  const sorted = [...data].sort((a, b) => a.year - b.year);
  const chartData = sorted.map((d) => ({
    name: String(d.year),
    amount: d.amount,
    yoy: d.yoy ?? 0,
  }));
  return (
    <div style={{ width: "100%", height: 320, marginBottom: 16 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value: any) =>
              typeof value === "number"
                ? `$${Number(value).toLocaleString()}`
                : value
            }
          />
          <Bar dataKey="amount" fill="#4caf50" />
          <Line
            type="monotone"
            dataKey="yoy"
            stroke="#ff9800"
            strokeWidth={2}
            yAxisId={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
