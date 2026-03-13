"use client";
import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import Skeleton from "@mui/material/Skeleton";
import { apiFetch } from "@/lib/apiFetch";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";

interface RetirementEntry {
  year: number;
  endAmount: number;
}

interface SalaryEntry {
  year: number;
  amount: number;
}

interface ApiResponse<T> {
  ok: boolean;
  entries?: T[];
}

interface ProgressChartRow {
  year: string;
  retirement: number | null;
  salary: number | null;
}

export default function ProgressCharts() {
  const [data, setData] = useState<ProgressChartRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const retirementResponse = (await (
          await apiFetch("/api/progress/retirement")
        ).json()) as ApiResponse<RetirementEntry>;
        const salaryResponse = (await (
          await apiFetch("/api/salary")
        ).json()) as ApiResponse<SalaryEntry>;
        const retirementEntries = retirementResponse.ok
          ? (retirementResponse.entries ?? [])
          : [];
        const salaryEntries = salaryResponse.ok
          ? (salaryResponse.entries ?? [])
          : [];

        // Note N: Build maps by year first so merge is O(n) instead of O(n^2).
        const retirementByYear = new Map<number, number>();
        for (const entry of retirementEntries) {
          retirementByYear.set(entry.year, entry.endAmount);
        }
        const salaryByYear = new Map<number, number>();
        for (const entry of salaryEntries) {
          salaryByYear.set(entry.year, entry.amount);
        }

        const years = Array.from(
          new Set([...retirementByYear.keys(), ...salaryByYear.keys()]),
        ).sort((a, b) => a - b);

        const merged: ProgressChartRow[] = years.map((year) => ({
          year: String(year),
          retirement: retirementByYear.get(year) ?? null,
          salary: salaryByYear.get(year) ?? null,
        }));

        if (!mounted) return;
        setData(merged);
      } catch {
        // ignore errors; leave data empty
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const tooltipContent = ({ active, label, payload }: any) => {
    if (!active || !payload?.length) return null;
    const rows = payload
      .filter(
        (entry: any) =>
          entry && entry.value !== null && entry.value !== undefined,
      )
      .map((entry: any) => {
        const labelText = entry.name ?? entry.dataKey;
        const value =
          typeof entry.value === "number"
            ? `$${Number(entry.value).toLocaleString()}`
            : entry.value;
        return { label: String(labelText), value, color: entry.color };
      });
    return rows.length > 0 ? (
      <ChartTooltipCard
        title={typeof label === "string" ? label : undefined}
        rows={rows}
      />
    ) : null;
  };

  return (
    <Box sx={{ width: "100%", height: 300 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Progress Over Time
      </Typography>

      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={240} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip content={tooltipContent} />
            <Legend />
            <Line
              type="monotone"
              dataKey="retirement"
              name="Retirement End"
              stroke="#8884d8"
              strokeWidth={2}
              dot
            />
            <Line
              type="monotone"
              dataKey="salary"
              name="Salary"
              stroke="#82ca9d"
              strokeWidth={2}
              dot
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
