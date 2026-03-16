"use client";

import React, { useEffect, useState } from "react";
import { Box, Button, List, ListItem, ListItemText } from "@mui/material";
import MilestoneForm from "@/components/forms/MilestoneForm";
import { ProgressEntryDialog } from "@/components/progress/ProgressEntryDialog";
import { SectionHeader } from "@/components/progress/SectionHeader";
import { apiFetch } from "@/lib/api/apiFetch";
import type { MilestoneEntry } from "@/lib/types/types";

interface MilestonesApiResponse {
  ok: boolean;
  entries?: MilestoneEntry[];
  error?: string;
}

export default function MilestonesList() {
  // Note 1: The dialog only owns form input state while the list keeps the
  // fetched milestones. That way closing the popup never discards loaded data.
  const [items, setItems] = useState<MilestoneEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/progress/milestones");
      const data = (await res.json()) as MilestonesApiResponse;
      if (!data.ok) throw new Error(data.error || "Failed to load");
      setItems(data.entries ?? []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : String(fetchError),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const handleSaved = async () => {
    setDialogOpen(false);
    await fetchItems();
  };

  const handleDelete = async (
    milestoneId: string,
    year: number | null | undefined,
  ) => {
    if (!confirm("Delete this milestone?")) return;

    try {
      const params = new URLSearchParams({ milestoneId });
      if (year !== null && year !== undefined) {
        params.set("year", String(year));
      }

      const response = await apiFetch(
        `/api/progress/milestones?${params.toString()}`,
        {
          method: "DELETE",
        },
      );
      const data = (await response.json()) as MilestonesApiResponse;
      if (!data.ok) {
        throw new Error(data.error || "Delete failed");
      }
      await fetchItems();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : String(deleteError),
      );
    }
  };

  return (
    <Box>
      <SectionHeader
        title="Milestones"
        sx={{ mb: 2 }}
        action={
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            Add Milestone
          </Button>
        }
      />

      {dialogOpen ? (
        <ProgressEntryDialog
          open={dialogOpen}
          title="Add Milestone"
          onClose={() => setDialogOpen(false)}
        >
          <MilestoneForm
            onSaved={handleSaved}
            onCancel={() => setDialogOpen(false)}
          />
        </ProgressEntryDialog>
      ) : null}

      {error ? <Box sx={{ color: "error.main", mb: 1 }}>{error}</Box> : null}

      <List>
        {items.length === 0 && !loading ? (
          <ListItem>
            <ListItemText primary="No milestones yet" />
          </ListItem>
        ) : null}
        {items.map((item) => (
          <ListItem
            key={item.milestoneId}
            secondaryAction={
              <Button
                size="small"
                color="error"
                onClick={() => handleDelete(item.milestoneId, item.year)}
              >
                Delete
              </Button>
            }
          >
            <ListItemText
              primary={`$${Number(item.amount).toLocaleString()}`}
              secondary={`${item.year ? `Year: ${item.year}` : ""} ${item.age ? ` Age: ${item.age}` : ""}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
