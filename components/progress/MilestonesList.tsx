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

interface Milestone {
  milestoneId: string;
  amount: number;
  year: number | null;
  age: number | null;
}

interface MilestonesApiResponse {
  ok: boolean;
  entries?: Milestone[];
  error?: string;
}

export default function MilestonesList() {
  const [items, setItems] = useState<Milestone[]>([]);
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
      const data = (await res.json()) as MilestonesApiResponse;
      if (!data.ok) throw new Error(data.error || "Failed to load");
      setItems(data.entries || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const add = async () => {
    if (!amount || loading) return;
    try {
      const body: { amount: number; year?: number; age?: number } = {
        amount: Number(sanitizeNumberString(amount)),
      };
      if (year) body.year = Number(sanitizeNumberString(year));
      if (age) body.age = Number(sanitizeNumberString(age));
      const res = await apiFetch("/api/progress/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as MilestonesApiResponse;
      if (!data.ok) throw new Error(data.error || "Create failed");
      setAmount("");
      setYear("");
      setAge("");
      await fetchItems();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
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
        <Button variant="contained" onClick={add} disabled={loading || !amount}>
          {loading ? "Loading..." : "Add"}
        </Button>
      </Stack>
      {error && <Box sx={{ color: "error.main", mb: 1 }}>{error}</Box>}
      <List>
        {items.length === 0 && !loading ? (
          <ListItem>
            <ListItemText primary="No milestones yet" />
          </ListItem>
        ) : null}
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
