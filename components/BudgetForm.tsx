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
    setAllocations((s) => s.filter((_, i) => i !== idx));
  }
  function updateRow(idx: number, field: keyof Allocation, value: any) {
    setAllocations((s) => {
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
