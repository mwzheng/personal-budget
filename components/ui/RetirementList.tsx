"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import RetirementForm from "@/components/forms/RetirementForm";
import { ProgressEntryDialog } from "@/components/progress/ProgressEntryDialog";
import { SectionHeader } from "@/components/progress/SectionHeader";
import { StatusAlert } from "@/components/ui/StatusAlert";
import { apiFetch } from "@/lib/api/apiFetch";
import type { RetirementEntry } from "@/lib/types/types";

interface RetirementApiResponse {
  ok: boolean;
  entries?: RetirementEntry[];
  error?: string;
}

interface Props {
  onEntriesChanged?: () => void | Promise<void>;
}

export default function RetirementList({ onEntriesChanged }: Props) {
  // Note 1: RetirementList still owns its CRUD list state locally, but it now
  // also notifies the parent page after mutations so sibling charts can refetch.
  const [entries, setEntries] = useState<RetirementEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<RetirementEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/progress/retirement");
      const data = (await res.json()) as RetirementApiResponse;
      if (!data.ok) throw new Error(data.error || "Failed to load");
      setEntries(data.entries ?? []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEntries();
  }, []);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const handleSaved = async () => {
    closeDialog();
    await fetchEntries();
    await Promise.resolve(onEntriesChanged?.());
  };

  const handleDelete = async (entryId?: string, year?: number) => {
    if (!entryId || !year) return;
    if (!confirm("Delete this retirement entry?")) return;
    try {
      const res = await apiFetch(
        `/api/progress/retirement?entryId=${encodeURIComponent(entryId)}&year=${encodeURIComponent(String(year))}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Delete failed");
      await fetchEntries();
      await Promise.resolve(onEntriesChanged?.());
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  return (
    <Box>
      <SectionHeader
        title="Retirement Accounts"
        sx={{ mb: 2 }}
        action={
          <Button
            variant="contained"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            Add Entry
          </Button>
        }
      />

      {dialogOpen ? (
        <ProgressEntryDialog
          open={dialogOpen}
          title={editing ? "Edit Retirement Entry" : "Add Retirement Entry"}
          onClose={closeDialog}
        >
          <RetirementForm
            defaultEntry={editing || undefined}
            onSaved={handleSaved}
            onCancel={closeDialog}
          />
        </ProgressEntryDialog>
      ) : null}

      {error ? (
        <StatusAlert message={error} onClose={() => setError(null)} />
      ) : null}

      <List>
        {entries.map((entry) => (
          <React.Fragment key={entry.entryId}>
            <ListItem
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditing(entry);
                      setDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(entry.entryId, entry.year)}
                  >
                    Delete
                  </Button>
                </Stack>
              }
            >
              <ListItemText
                primary={`${entry.year} — start: $${Number(entry.startAmount).toLocaleString()} end: $${Number(entry.endAmount).toLocaleString()}`}
                secondary={`Change: $${Number(entry.change ?? entry.endAmount - entry.startAmount).toLocaleString()} ${entry.pct !== null && entry.pct !== undefined ? `(${entry.pct}%)` : ""}`}
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>

      {entries.length === 0 && !loading ? (
        <Typography>No retirement entries yet.</Typography>
      ) : null}
    </Box>
  );
}
