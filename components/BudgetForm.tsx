// Note 1: BudgetForm provides an editable table of allocation rows, each with a
// category name and a percentage/amount value. The three default rows reflect
// the popular 50/30/20 personal finance rule (Needs/Wants/Savings).
"use client";

import React, { useState } from "react";
import { apiFetch } from "../lib/apiFetch";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

export type Allocation = { category: string; amount: number };

export function BudgetForm({ onSaved }: { onSaved?: (budget: any) => void }) {
  const [name, setName] = useState("");
  const [allocations, setAllocations] = useState<Allocation[]>([
    { category: "Needs", amount: 50 },
    { category: "Wants", amount: 30 },
    { category: "Savings", amount: 20 },
  ]);
  const [saving, setSaving] = useState(false);

  function addRow() {
    setAllocations((s) => [...s, { category: "", amount: 0 }]);
  }
  function removeRow(idx: number) {
    // Note 2: `s.filter((_, i) => i !== idx)` creates a new array that excludes
    // the element at index `idx`. The underscore `_` is a convention for an
    // unused parameter; here the value is ignored and only the index matters.
    setAllocations((s) => s.filter((_, i) => i !== idx));
  }
  function updateRow(idx: number, field: keyof Allocation, value: any) {
    setAllocations((s) => {
      // Note 3: Spreading `[...s]` creates a shallow copy of the array before
      // modifying it. React state should never be mutated directly; always
      // produce a new array/object to trigger a re-render.
      const copy = [...s];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  }

  async function saveBudget() {
    setSaving(true);
    try {
      const payload = { name, allocations };
      const res = await apiFetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || res.statusText);
      setName("");
      // reset to defaults
      setAllocations([
        { category: "Needs", amount: 50 },
        { category: "Wants", amount: 30 },
        { category: "Savings", amount: 20 },
      ]);
      onSaved?.(data);
    } catch (err) {
      console.error("Failed to save budget", err);
      alert("Failed to save budget: " + String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <TextField
        label="Budget name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        size="small"
        fullWidth
      />

      <Table size="small">
        <TableBody>
          {allocations.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <TextField
                  placeholder="Category"
                  value={row.category}
                  onChange={(e) => updateRow(idx, "category", e.target.value)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <TextField
                  placeholder="Amount"
                  type="number"
                  value={String(row.amount)}
                  onChange={(e) =>
                    updateRow(idx, "amount", Number(e.target.value || 0))
                  }
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <IconButton onClick={() => removeRow(idx)} size="small">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box display="flex" gap={1}>
        <Button startIcon={<AddIcon />} onClick={addRow} size="small">
          Add category
        </Button>
        <Box flex={1} />
        {/* Note 4: The Save button is disabled both while the API request is in
            flight (`saving`) and when the name is empty. This prevents double
            submission and enforces a basic required-field rule without a form tag. */}
        <Button
          variant="contained"
          color="primary"
          onClick={saveBudget}
          disabled={saving || !name}
        >
          Save Budget
        </Button>
      </Box>
    </Box>
  );
}
