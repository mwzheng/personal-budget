// Note 1: SalaryList is the top-level orchestrator for the salary history page.
// It manages the list of entries, the add/edit form visibility, and the
// SalaryChart. Splitting into List, Form, and Chart sub-components keeps each
// piece focused and independently testable.
"use client";

import { useEffect, useState } from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
  Stack,
} from "@mui/material";
import SalaryChart from "@/components/charts/SalaryChart";
import SalaryForm from "@/components/forms/SalaryForm";
import { ProgressEntryDialog } from "@/components/progress/ProgressEntryDialog";
import { SectionHeader } from "@/components/progress/SectionHeader";
import { ActionIconButton } from "@/components/ui/action-icon-button";
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
  onEntriesChanged?: () => void | Promise<void>;
}

export default function SalaryList({ onEntriesChanged }: Props) {
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

      <SalaryChart data={entries} loading={loading} />

      {/* Note 5: Responsive card grid — single column on mobile (xs),
          two columns on sm+. Each card surfaces year, salary amount, and
          the computed YoY change with a colour-coded Chip for quick scanning. */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
          },
        }}
      >
        {entries.map((entry) => {
          // Note 6: Chip colour is derived from the sign of the YoY value so
          // the user gets an instant positive/negative visual signal.
          const chipColor: "success" | "error" | "default" =
            (entry.yoy ?? 0) > 0
              ? "success"
              : (entry.yoy ?? 0) < 0
                ? "error"
                : "default";

          return (
            <Card key={entry.entryId}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                {/* ── Top row: year heading + action buttons ── */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1.5 }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    {entry.year}
                  </Typography>
                  <Stack direction="row" spacing={0.75}>
                    <ActionIconButton
                      tooltip="Edit"
                      ariaLabel={`Edit salary entry for ${entry.year}`}
                      onClick={() => {
                        setEditing(entry);
                        setDialogOpen(true);
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </ActionIconButton>
                    <ActionIconButton
                      tooltip="Delete"
                      ariaLabel={`Delete salary entry for ${entry.year}`}
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
                </Stack>

                {/* ── Middle: salary amount prominently displayed ── */}
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
                  ${Number(entry.amount).toLocaleString()}
                </Typography>

                {/* ── Bottom: YoY percentage chip ── */}
                {entry.yoy !== null && entry.yoy !== undefined ? (
                  <Chip
                    label={`${entry.yoy}%`}
                    size="small"
                    variant="outlined"
                    color={chipColor}
                  />
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </Box>

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
