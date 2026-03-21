"use client";

import React, { useEffect, useState } from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import MilestoneForm from "@/components/forms/MilestoneForm";
import { ProgressEntryDialog } from "@/components/progress/ProgressEntryDialog";
import { SectionHeader } from "@/components/progress/SectionHeader";
import { ActionIconButton } from "@/components/ui/action-icon-button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusAlert } from "@/components/ui/StatusAlert";
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
  const [deleteCandidate, setDeleteCandidate] = useState<{
    milestoneId: string;
    year: number | null | undefined;
  } | null>(null);

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

  // Note 2: Delete is a two-step flow: the button sets the candidate, and
  // confirmDelete performs the actual API call only after the user confirms via
  // the ConfirmDialog. This replaces the native confirm() for visual consistency.
  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    const { milestoneId, year } = deleteCandidate;
    setDeleteCandidate(null);
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
          <Button
            variant="contained"
            size="small"
            onClick={() => setDialogOpen(true)}
          >
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

      {error ? (
        <StatusAlert message={error} onClose={() => setError(null)} />
      ) : null}

      <List>
        {items.length === 0 && !loading ? (
          <Typography
            color="text.secondary"
            sx={{ py: 2, textAlign: "center" }}
          >
            No milestones yet.
          </Typography>
        ) : null}
        {items.map((item) => (
          <ListItem
            key={item.milestoneId}
            secondaryAction={
              <ActionIconButton
                tooltip="Delete"
                ariaLabel={`Delete milestone for ${item.year ?? "no year"}`}
                tone="danger"
                onClick={() =>
                  setDeleteCandidate({
                    milestoneId: item.milestoneId,
                    year: item.year,
                  })
                }
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </ActionIconButton>
            }
          >
            <ListItemText
              primary={`$${Number(item.amount).toLocaleString()}`}
              secondary={`${item.year ? `Year: ${item.year}` : ""} ${item.age ? ` Age: ${item.age}` : ""}`}
            />
          </ListItem>
        ))}
      </List>

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete Milestone"
        message="Are you sure you want to delete this milestone? This action cannot be undone."
        confirmLabel="Delete"
        onClose={() => setDeleteCandidate(null)}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}
