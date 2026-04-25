"use client";

// Note 1: MilestonesList has been redesigned from a two-column card grid into
// a single-column vertical timeline. Entries are sorted year DESC (null last),
// then age DESC within the same year. Only create and delete are supported;
// the current API has no edit endpoint for milestones.

import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useEffect, useState } from "react";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { Box, Button, Stack, Typography } from "@mui/material";
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

/** Sort milestones year DESC (null last), then age DESC within same year. */
function sortMilestones(entries: MilestoneEntry[]): MilestoneEntry[] {
  return [...entries].sort((a, b) => {
    const aYear = a.year ?? -Infinity;
    const bYear = b.year ?? -Infinity;
    if (bYear !== aYear) return bYear - aYear;
    const aAge = a.age ?? -Infinity;
    const bAge = b.age ?? -Infinity;
    return bAge - aAge;
  });
}

export default function MilestonesList() {
  // Note 2: The dialog only owns form input state while the list keeps the
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

  const sorted = sortMilestones(items);

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

      {/* Note 3: Vertical timeline — left rail (dot + connector line) + right content.
          The connector line is hidden on the last item so the rail ends cleanly. */}
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {sorted.map((item, index) => {
          const isLast = index === sorted.length - 1;
          return (
            <Box
              component="li"
              key={item.milestoneId}
              sx={{ display: "flex", gap: 2 }}
            >
              {/* Left rail: dot + connector */}
              <Box
                aria-hidden="true"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                  pt: 0.25,
                }}
              >
                <RadioButtonCheckedIcon
                  sx={{ color: "primary.main", fontSize: 20 }}
                />
                {!isLast && (
                  <Box
                    sx={{
                      width: 2,
                      flexGrow: 1,
                      minHeight: 24,
                      bgcolor: "divider",
                      mt: 0.5,
                      mb: 0.5,
                    }}
                  />
                )}
              </Box>

              {/* Right content */}
              <Box sx={{ pb: isLast ? 0 : 2.5, flexGrow: 1, minWidth: 0 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
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

                {/* Secondary metadata: year and/or age */}
                {item.year || item.age ? (
                  <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
                    {item.year ? (
                      <Typography variant="body2" color="text.secondary">
                        Year {item.year}
                      </Typography>
                    ) : null}
                    {item.age ? (
                      <Typography variant="body2" color="text.secondary">
                        Age {item.age}
                      </Typography>
                    ) : null}
                  </Stack>
                ) : null}

                {/* Optional note */}
                {item.note ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.75, fontStyle: "italic" }}
                  >
                    {item.note}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Note 4: Delete is a two-step flow; confirmDelete performs the API call
          only after the user confirms in the ConfirmDialog. */}
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
