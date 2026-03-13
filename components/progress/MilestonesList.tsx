"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  TextField,
  Stack,
  Typography,
} from "@mui/material";
import { apiFetch } from "@/lib/apiFetch";
import { sanitizeNumberString } from "@/lib/format";

export default function MilestonesList() {
  const [items, setItems] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [year, setYear] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/progress/milestones");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to load");
      setItems(data.entries || []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const add = async () => {
    if (!amount) return;
    try {
      const body: any = { amount: Number(sanitizeNumberString(amount)) };
      if (year) body.year = Number(sanitizeNumberString(year));
      if (age) body.age = Number(sanitizeNumberString(age));
      const res = await apiFetch("/api/progress/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Create failed");
      setAmount("");
      setYear("");
      setAge("");
      fetchItems();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Milestones
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          label="Amount"
          value={amount}
          onChange={(e) => setAmount(sanitizeNumberString(e.target.value))}
          type="number"
        />
        <TextField
          label="Year"
          value={year}
          onChange={(e) => setYear(sanitizeNumberString(e.target.value))}
          type="number"
        />
        <TextField
          label="Age"
          value={age}
          onChange={(e) => setAge(sanitizeNumberString(e.target.value))}
          type="number"
        />
        <Button variant="contained" onClick={add}>
          Add
        </Button>
      </Stack>
      {error && <Box sx={{ color: "error.main", mb: 1 }}>{error}</Box>}
      <List>
        {items.map((it) => (
          <ListItem key={it.milestoneId}>
            <ListItemText
              primary={`$${Number(it.amount).toLocaleString()}`}
              secondary={`${it.year ? `Year: ${it.year}` : ""} ${it.age ? ` Age: ${it.age}` : ""}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
