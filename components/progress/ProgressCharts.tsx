"use client";
import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
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

export default function ProgressCharts() {
  const [ret, setRet] = useState<any[]>([]);
  const [sal, setSal] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const r = await (await apiFetch("/api/progress/retirement")).json();
      const s = await (await apiFetch("/api/salary")).json();
      const re = r.ok ? r.entries : [];
      const se = s.ok ? s.entries : [];
      setRet(re);
      setSal(se);
      const years = Array.from(
        new Set([
          ...(re || []).map((x: any) => x.year),
          ...(se || []).map((x: any) => x.year),
        ]),
      ).sort((a: any, b: any) => a - b);
      const merged = years.map((y: any) => ({
        year: String(y),
        retirement:
          (re || []).find((x: any) => x.year === y)?.endAmount ?? null,
        salary: (se || []).find((x: any) => x.year === y)?.amount ?? null,
      }));
      setData(merged);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Box sx={{ width: "100%", height: 300 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Progress Over Time
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
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
    </Box>
  );
}
