// Note 1: SankeyForm collects budget allocation inputs and sends them to
// `/api/sankey`. The form implements the 50/30/20 rule (Needs/Wants/Savings)
// as initial defaults, mirroring the BudgetForm defaults. Both sliders and
// the submit button are disabled when allocations do not sum to exactly 100%.
"use client";

import { StatusAlert } from "@/components/ui/StatusAlert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { SankeyRequestBody, SankeyResponse } from "@/lib/types/types";
import { apiFetch } from "@/lib/api/apiFetch";

interface Props {
  onResult: (response: SankeyResponse) => void;
}

interface SliderRow {
  key: "Need" | "Want" | "Saving";
  label: string;
}

// Note 2: `ROWS` is a config-driven array that drives slider rendering.
// Using a data array instead of three separate JSX blocks reduces repetition
// and makes it easy to add or rename categories later. Colors are resolved at
// render time via the MUI theme so they adapt to light/dark mode.
const ROWS: SliderRow[] = [
  { key: "Need", label: "Needs" },
  { key: "Want", label: "Wants" },
  { key: "Saving", label: "Savings" },
];

export function SankeyForm({ onResult }: Props) {
  const theme = useTheme();
  // Note 3: Map each budget category to a semantic palette token so colors
  // follow the active theme (light/dark) instead of being hardcoded hex values.
  const rowColors: Record<string, string> = {
    Need: theme.palette.error.main,
    Want: theme.palette.info.main,
    Saving: theme.palette.success.main,
  };

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
  // Note 4: Floating-point arithmetic means slider values may not sum to
  // exactly 100 (e.g. 33.33 + 33.33 + 33.34 = 100.0000...something). Using
  // `Math.abs(total - 100) < 0.01` accepts any total within 1 cent of 100,
  // avoiding false "invalid" errors from rounding.
  const isValid = Math.abs(total - 100) < 0.01 && monthlyIncome > 0;

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    setError(null);
    try {
      const body: SankeyRequestBody = {
        monthlyIncome,
        incomeLabel,
        // Note 4: `ROWS.map(...)` derives the allocations array from the slider
        // state in one pass. The order of entries in `ROWS` determines the order
        // Sankey nodes are rendered, so keeping ROWS as the source of truth avoids
        // accidental ordering bugs.
        allocations: ROWS.map((r) => ({
          category: r.key,
          percentage: pct[r.key],
        })),
      };
      const res = await apiFetch("/api/sankey", {
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

      {ROWS.map(({ key, label }) => (
        <Box key={key}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ color: rowColors[key] }}
            >
              {label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pct[key]}% &mdash; $
              {/* Note 5: `(monthlyIncome * pct[key]) / 100` converts a percentage
                  into a dollar amount. `toFixed(0)` rounds to the nearest dollar
                  so the display stays clean while the slider stores exact integers. */}
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
            sx={{ color: rowColors[key] }}
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

      {error && <StatusAlert message={error} onClose={() => setError(null)} />}

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
