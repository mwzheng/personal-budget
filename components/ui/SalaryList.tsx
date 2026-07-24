// Note 1: SalaryList is the top-level orchestrator for the salary history page.
// It manages the list of entries, the add/edit form visibility. The chart has
// been moved to the consolidated ProgressCharts tabbed panel so this component
// is a pure CRUD/data section.
"use client";

import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import { useEffect, useState } from "react";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Box,
  Button,
  Chip,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import SalaryForm from "@/components/forms/SalaryForm";
import { ProgressEntryDialog } from "@/components/progress/ProgressEntryDialog";
import { SectionHeader } from "@/components/progress/SectionHeader";
import { ActionIconButton } from "@/components/ui/ActionIconButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
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
  /** Set to false when SalaryList is used as a full standalone page and a
   *  PageHeader is rendered above it by the parent page route. */
  showSectionHeader?: boolean;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function SalaryList({
  onEntriesChanged,
  showSectionHeader = true,
}: Props) {
  const [entries, setEntries] = useState<SalaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  // Note 2: `editing` holds the full salary object being edited, or `null` when
  // the form is in "create new" mode. Passing it as `defaultEntry` pre-fills the
  // SalaryForm fields when the user clicks Edit.
  const [editing, setEditing] = useState<SalaryEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    candidate: deleteCandidate,
    requestDelete,
    confirmDelete,
    cancelDelete,
    isDeleting,
  } = useDeleteConfirmation<{ entryId: string; year: number }>({
    onConfirm: async ({ entryId, year }) => {
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
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      }
    },
  });

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/salary");
      const data = (await res.json()) as SalaryApiResponse;
      if (!data.ok) throw new Error(data.error || "Failed to load");
      setEntries(data.entries ?? []);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
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
  // the hook's confirmDelete performs the actual API call only after the user
  // confirms via the ConfirmDialog.

  return (
    <Box>
      {showSectionHeader && (
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
      )}

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

      {/* Compact history table keeps the dashboard scan-friendly while the row
          actions preserve the existing edit/delete workflows. */}
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 460 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell>Year</TableCell>
              <TableCell>Salary</TableCell>
              <TableCell>Year-over-year</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => {
              const chipColor: "success" | "error" | "default" =
                (entry.yoy ?? 0) > 0
                  ? "success"
                  : (entry.yoy ?? 0) < 0
                    ? "error"
                    : "default";

              return (
                <TableRow key={entry.entryId} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{entry.year}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    ${Number(entry.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {entry.yoy !== null && entry.yoy !== undefined ? (
                      <Chip
                        label={`${entry.yoy}%`}
                        size="small"
                        variant="outlined"
                        color={chipColor}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="flex-end"
                    >
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
                          requestDelete({
                            entryId: entry.entryId,
                            year: entry.year,
                          })
                        }
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </ActionIconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {entries.length === 0 && !loading ? (
        <EmptyState
          icon={<TrendingUpOutlinedIcon />}
          message="No salary history yet."
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete Salary Entry"
        message="Are you sure you want to delete this salary entry? This action cannot be undone."
        confirmLabel="Delete"
        loading={isDeleting}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}
