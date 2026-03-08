// Note 1: BudgetForm provides an editable table of allocation rows, each with a
// category name and a percentage/amount value. The three default rows reflect
// the popular 50/30/20 personal finance rule (Needs/Wants/Savings).
"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiFetch";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

export type Allocation = { category: string; amount: number };

export function BudgetForm({
  initialBudget,
  onSaved,
  onCancel,
}: {
  initialBudget?: any;
  onSaved?: (budget: any) => void;
  onCancel?: () => void;
}) {
  const defaultAllocations: Allocation[] = [
    { category: "Needs", amount: 50 },
    { category: "Wants", amount: 30 },
    { category: "Savings", amount: 20 },
  ];

  const [name, setName] = useState<string>(initialBudget?.name ?? "");
  const [allocations, setAllocations] = useState<Allocation[]>(
    initialBudget?.allocations ?? defaultAllocations,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialBudget) {
      setName(initialBudget.name || "");
      setAllocations(initialBudget.allocations || defaultAllocations);
    }
  }, [initialBudget]);

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

      let res: Response;
      if (initialBudget && initialBudget.budgetId) {
        // Update existing budget
        res = await apiFetch(`/api/budgets/${initialBudget.budgetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        res = await apiFetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || res.statusText);

      if (!initialBudget) {
        // reset to defaults for newly created
        setName("");
        setAllocations(defaultAllocations);
      }

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
        inputProps={{ "aria-label": "Budget name" }}
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
                  inputProps={{ "aria-label": `category-${idx}` }}
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
                  inputProps={{ "aria-label": `amount-${idx}` }}
                />
              </TableCell>
              <TableCell align="right">
                <IconButton
                  onClick={() => removeRow(idx)}
                  size="small"
                  aria-label={`delete-row-${idx}`}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box display="flex" gap={1}>
        <Button
          startIcon={<AddIcon />}
          onClick={addRow}
          size="small"
          aria-label="add-category"
        >
          Add category
        </Button>
        <Box flex={1} />
        {initialBudget && (
          <Button onClick={onCancel} aria-label="cancel-edit">
            Cancel
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={saveBudget}
          disabled={saving || !name}
          aria-label="save-budget"
        >
          {initialBudget ? "Update Budget" : "Save Budget"}
        </Button>
      </Box>
    </Box>
  );
}
