// Note 1: SalaryList is the top-level orchestrator for the salary history page.
// It manages the list of entries, the add/edit form visibility, and the
// SalaryChart. Splitting into List, Form, and Chart sub-components keeps each
// piece focused and independently testable.
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
import SalaryChart from "@/components/charts/SalaryChart";
import SalaryForm from "@/components/forms/SalaryForm";
import { ProgressEntryDialog } from "@/components/progress/ProgressEntryDialog";
import { SectionHeader } from "@/components/progress/SectionHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusAlert } from "@/components/ui/StatusAlert";
import { apiFetch } from "@/lib/api/apiFetch";
import type { SalaryEntry } from "@/lib/types/types";

interface SalaryApiResponse {
  ok: boolean;
  entries?: SalaryEntry[];
  error?: string;
}

interface Props {
  selectedYears?: string[];
  onEntriesChanged?: () => void | Promise<void>;
}

export default function SalaryList({
  selectedYears = [],
  onEntriesChanged,
}: Props) {
  const [entries, setEntries] = useState<SalaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  // Note 2: `editing` holds the full salary object being edited, or `null` when
  // the form is in "create new" mode. Passing it as `defaultEntry` pre-fills the
  // SalaryForm fields when the user clicks Edit.
  const [editing, setEditing] = useState<SalaryEntry | null>(null);
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
      const res = await apiFetch("/api/salary");
      const data = (await res.json()) as SalaryApiResponse;
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
    // Note 3: After a successful save the dialog is dismissed and the list is
    // re-fetched. Re-fetching from the server guarantees the list reflects the
    // freshly stored data (including any server-computed YoY values).
    closeDialog();
    await fetchEntries();
    await Promise.resolve(onEntriesChanged?.());
  };

  // Note 4: Delete is a two-step flow: the button sets the candidate, and
  // confirmDelete performs the actual API call only after the user confirms via
  // the ConfirmDialog. Year is required in the query string alongside entryId
  // because the DynamoDB sort key encodes both: "salary#<year>#<entryId>".
  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    const { entryId, year } = deleteCandidate;
    setDeleteCandidate(null);
    try {
      const res = await apiFetch(
        "/api/salary?entryId=" +
          encodeURIComponent(entryId) +
          "&year=" +
          encodeURIComponent(String(year)),
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
        title="Salary History"
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
          title={editing ? "Edit Salary Entry" : "Add Salary Entry"}
          onClose={closeDialog}
        >
          <SalaryForm
            defaultEntry={editing || undefined}
            onSaved={handleSaved}
            onCancel={closeDialog}
          />
        </ProgressEntryDialog>
      ) : null}

      {error ? (
        <StatusAlert message={error} onClose={() => setError(null)} />
      ) : null}

      <SalaryChart
        data={entries}
        loading={loading}
        selectedYears={selectedYears}
      />

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
                    onClick={() =>
                      setDeleteCandidate({
                        entryId: entry.entryId!,
                        year: entry.year,
                      })
                    }
                  >
                    Delete
                  </Button>
                </Stack>
              }
            >
              <ListItemText
                primary={`${entry.year} — $${Number(entry.amount).toLocaleString()}`}
                secondary={entry.yoy !== null ? `YoY: ${entry.yoy}%` : ""}
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>

      {entries.length === 0 && !loading ? (
        <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
          No salary history yet.
        </Typography>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete Salary Entry"
        message="Are you sure you want to delete this salary entry? This action cannot be undone."
        confirmLabel="Delete"
        onClose={() => setDeleteCandidate(null)}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}
