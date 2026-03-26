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

      {/* Note 3: Responsive card grid — single column on mobile (xs),
          two columns on sm+. Each card surfaces year, start/end amounts,
          and the computed change with a colour-coded Chip for quick scanning. */}
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
          const change = Number(
            entry.change ?? entry.endAmount - entry.startAmount,
          );
          const pct = entry.pct;

          // Note 4: Chip colour is derived from the sign of the change so the
          // user gets an instant positive/negative visual signal.
          const chipColor: "success" | "error" | "default" =
            change > 0 ? "success" : change < 0 ? "error" : "default";

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
                </Stack>

                {/* ── Middle row: start / end amounts side-by-side ── */}
                <Stack direction="row" spacing={3} sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Start
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      ${Number(entry.startAmount).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      End
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      ${Number(entry.endAmount).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>

                {/* ── Bottom row: change amount + percentage chip ── */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Change: ${change.toLocaleString()}
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
              </CardContent>
            </Card>
          );
        })}
      </Box>

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
