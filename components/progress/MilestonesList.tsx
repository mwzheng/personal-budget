"use client";

import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import { useEffect, useState } from "react";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import MilestoneForm from "@/components/forms/MilestoneForm";
import { ProgressEntryDialog } from "@/components/progress/ProgressEntryDialog";
import { SectionHeader } from "@/components/progress/SectionHeader";
import { ActionIconButton } from "@/components/ui/ActionIconButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
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
  const {
    candidate: deleteCandidate,
    requestDelete,
    confirmDelete,
    cancelDelete,
    isDeleting,
  } = useDeleteConfirmation<{
    milestoneId: string;
    year: number | null | undefined;
  }>({
    onConfirm: async ({ milestoneId, year }) => {
      try {
        const params = new URLSearchParams({ milestoneId });
        if (year !== null && year !== undefined) {
          params.set("year", String(year));
        }

        const response = await apiFetch(
          `/api/progress/milestones?${params.toString()}`,
          { method: "DELETE" },
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
    },
  });

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
  // the hook's confirmDelete performs the actual API call only after the user
  // confirms via the ConfirmDialog.

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

      {items.length === 0 && !loading ? (
        <EmptyState icon={<FlagOutlinedIcon />} message="No milestones yet." />
      ) : null}

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
        {items.map((item) => (
          <Card key={item.milestoneId}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6" fontWeight={600}>
                  ${Number(item.amount).toLocaleString()}
                </Typography>
                <ActionIconButton
                  tooltip="Delete"
                  ariaLabel={`Delete milestone for ${item.year ?? "no year"}`}
                  tone="danger"
                  onClick={() =>
                    requestDelete({
                      milestoneId: item.milestoneId,
                      year: item.year,
                    })
                  }
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </ActionIconButton>
              </Stack>

              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                {item.year ? (
                  <Typography variant="body2" color="text.secondary">
                    Year: {item.year}
                  </Typography>
                ) : null}
                {item.age ? (
                  <Typography variant="body2" color="text.secondary">
                    Age: {item.age}
                  </Typography>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete Milestone"
        message="Are you sure you want to delete this milestone? This action cannot be undone."
        confirmLabel="Delete"
        loading={isDeleting}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}
