"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { SankeyRequestBody, SankeyResponse } from "@/lib/types";

interface Props {
  onResult: (response: SankeyResponse) => void;
}

interface SliderRow {
  key: "Need" | "Want" | "Saving";
  label: string;
  color: string;
}

const ROWS: SliderRow[] = [
  { key: "Need", label: "Needs", color: "#ef5350" },
  { key: "Want", label: "Wants", color: "#42a5f5" },
  { key: "Saving", label: "Savings", color: "#66bb6a" },
];

export function SankeyForm({ onResult }: Props) {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(5000);
  const [incomeLabel, setIncomeLabel] = useState("Income");
  const [pct, setPct] = useState<Record<string, number>>({
    Need: 50,
    Want: 30,
    Saving: 20,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = Object.values(pct).reduce((s, v) => s + v, 0);
  const isValid = Math.abs(total - 100) < 0.01 && monthlyIncome > 0;

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    setError(null);
    try {
      const body: SankeyRequestBody = {
        monthlyIncome,
        incomeLabel,
        allocations: ROWS.map((r) => ({
          category: r.key,
          percentage: pct[r.key],
        })),
      };
      const res = await fetch("/api/sankey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Unknown error");
      onResult(data as SankeyResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box display="flex" flexDirection="column" gap={2.5}>
      <TextField
        label="Income Source Label"
        value={incomeLabel}
        onChange={(e) => setIncomeLabel(e.target.value)}
        size="small"
        fullWidth
      />
      <TextField
        label="Monthly Income"
        type="number"
        value={monthlyIncome}
        onChange={(e) => setMonthlyIncome(Number(e.target.value))}
        size="small"
        fullWidth
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          },
        }}
      />

      <Divider />

      <Typography variant="subtitle2" color="text.secondary">
        Category Allocations (must total 100%)
      </Typography>

      {ROWS.map(({ key, label, color }) => (
        <Box key={key}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" fontWeight={600} sx={{ color }}>
              {label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pct[key]}% &mdash; $
              {((monthlyIncome * pct[key]) / 100).toFixed(0)}/mo
            </Typography>
          </Box>
          <Slider
            value={pct[key]}
            onChange={(_, v) =>
              setPct((prev) => ({ ...prev, [key]: v as number }))
            }
            min={0}
            max={100}
            step={1}
            sx={{ color }}
          />
        </Box>
      ))}

      <Box display="flex" justifyContent="flex-end">
        <Typography
          variant="body2"
          color={isValid ? "success.main" : "error.main"}
          fontWeight={600}
        >
          Total: {total}%{!isValid && total !== 0 && " (must equal 100%)"}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={!isValid || loading}
        fullWidth
        size="large"
      >
        {loading ? "Generating…" : "Generate Budget Sankey"}
      </Button>
    </Box>
  );
}
