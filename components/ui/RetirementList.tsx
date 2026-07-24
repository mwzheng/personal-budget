"use client";

import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
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
import RetirementForm from "@/components/forms/RetirementForm";
import { ProgressEntryDialog } from "@/components/progress/ProgressEntryDialog";
import { SectionHeader } from "@/components/progress/SectionHeader";
import { ActionIconButton } from "@/components/ui/ActionIconButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function RetirementList({ onEntriesChanged }: Props) {
  // Note 1: RetirementList still owns its CRUD list state locally, but it also
  // notifies the parent page after mutations so sibling charts can refetch.
  const [entries, setEntries] = useState<RetirementEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<RetirementEntry | null>(null);
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
          `/api/progress/retirement?entryId=${encodeURIComponent(entryId)}&year=${encodeURIComponent(String(year))}`,
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
      const res = await apiFetch("/api/progress/retirement");
      const data = (await res.json()) as RetirementApiResponse;
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
    closeDialog();
    await fetchEntries();
    await Promise.resolve(onEntriesChanged?.());
  };

  // Note 2: Delete is a two-step flow: the button sets the candidate, and
  // the hook's confirmDelete performs the actual API call only after the user
  // confirms via the ConfirmDialog.

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

      {/* Compact history table keeps the dashboard scan-friendly while the row
          actions preserve the existing edit/delete workflows. */}
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 560 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell>Year</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Change</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => {
              const change = Number(
                entry.change ?? entry.endAmount - entry.startAmount,
              );
              const pct = entry.pct;
              const chipColor: "success" | "error" | "default" =
                change > 0 ? "success" : change < 0 ? "error" : "default";

              return (
                <TableRow key={entry.entryId} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{entry.year}</TableCell>
                  <TableCell>
                    ${Number(entry.startAmount).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    ${Number(entry.endAmount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">
                        ${change.toLocaleString()}
                      </Typography>
                      {pct !== null && pct !== undefined ? (
                        <Chip
                          label={`${pct}%`}
                          size="small"
                          variant="outlined"
                          color={chipColor}
                        />
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="flex-end"
                    >
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
          icon={<SavingsOutlinedIcon />}
          message="No retirement entries yet."
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete Retirement Entry"
        message="Are you sure you want to delete this retirement entry? This action cannot be undone."
        confirmLabel="Delete"
        loading={isDeleting}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}
