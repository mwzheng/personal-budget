"use client";

import React, { useEffect, useState } from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
import { ActionIconButton } from "@/components/ui/action-icon-button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
  // Note 1: RetirementList still owns its CRUD list state locally, but it also
  // notifies the parent page after mutations so sibling charts can refetch.
  const [entries, setEntries] = useState<RetirementEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<RetirementEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<{
    entryId: string;
    year: number;
  } | null>(null);

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

  // Note 2: Delete is a two-step flow: the button sets the candidate, and
  // confirmDelete performs the actual API call only after the user confirms via
  // the ConfirmDialog. This replaces the native confirm() for visual consistency.
  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    const { entryId, year } = deleteCandidate;
    setDeleteCandidate(null);
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
                <Stack direction="row" spacing={0.75}>
                  <ActionIconButton
                    tooltip="Edit"
                    ariaLabel={`Edit retirement entry for ${entry.year}`}
                    onClick={() => {
                      setEditing(entry);
                      setDialogOpen(true);
                    }}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </ActionIconButton>
                  <ActionIconButton
                    tooltip="Delete"
                    ariaLabel={`Delete retirement entry for ${entry.year}`}
                    tone="danger"
                    onClick={() =>
                      setDeleteCandidate({
                        entryId: entry.entryId!,
                        year: entry.year,
                      })
                    }
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </ActionIconButton>
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
        <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
          No retirement entries yet.
        </Typography>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete Retirement Entry"
        message="Are you sure you want to delete this retirement entry? This action cannot be undone."
        confirmLabel="Delete"
        onClose={() => setDeleteCandidate(null)}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}
