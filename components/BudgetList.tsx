"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiFetch";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";

export function BudgetList({
  onSelect,
}: {
  onSelect?: (budget: any) => void;
}) {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/budgets");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || res.statusText);
      setBudgets(data || []);
    } catch (err) {
      console.error("Failed to load budgets", err);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this budget?")) return;
    try {
      const res = await apiFetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setBudgets((s) => s.filter((b) => b.budgetId !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete budget");
    }
  }

  return (
    <div>
      <List dense>
        {loading && <div>Loading budgets…</div>}
        {budgets.map((b) => (
          <ListItem key={b.budgetId} button onClick={() => onSelect?.(b)}>
            <ListItemText
              primary={b.name}
              secondary={
                b.allocations
                  ? b.allocations.map((a: any) => `${a.category}: ${a.amount}`).join(", ")
                  : ""
              }
            />
            <ListItemSecondaryAction>
              <Button size="small" onClick={() => onSelect?.(b)}>
                Select
              </Button>
              <IconButton edge="end" onClick={() => handleDelete(b.budgetId)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </div>
  );
}
