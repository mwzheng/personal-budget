"use client";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useState } from "react";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { Box, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { ActionIconButton } from "@/components/ui/ActionIconButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import MilestoneForm from "@/components/forms/MilestoneForm";
import { ProgressEntryDialog } from "@/components/progress/ProgressEntryDialog";
import EmptyState from "@/components/ui/EmptyState";
import { StatusAlert } from "@/components/ui/StatusAlert";
import { apiFetch } from "@/lib/api/apiFetch";
import type { MilestoneEntry } from "@/lib/types/types";
import {
  buildMilestoneTimeline,
  formatMilestoneDate,
  sortMilestonesChronologically,
} from "@/lib/progress/milestones";

interface MilestonesApiResponse {
  ok: boolean;
  entries?: MilestoneEntry[];
  error?: string;
}

interface Props {
  /** Milestones fetched by the parent page. */
  milestones: MilestoneEntry[];
  /** Loading state from the parent page. */
  loading?: boolean;
  /** Current saved amount — used to show reached/unreached state. */
  currentAmount?: number | null;
  /** Called after a milestone is deleted so the parent can refresh. */
  onMilestonesChanged?: () => void | Promise<void>;
}

function fmt(n: number): string {
  return `$${n.toLocaleString()}`;
}

export default function MilestonesList({
  milestones,
  loading = false,
  currentAmount = null,
  onMilestonesChanged,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [editCandidate, setEditCandidate] = useState<MilestoneEntry | null>(
    null,
  );
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
        await onMilestonesChanged?.();
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : String(deleteError),
        );
      }
    },
  });

  const timeline = buildMilestoneTimeline(milestones);
  const nextUnreachedId = sortMilestonesChronologically(milestones)
    .filter(
      (milestone) => currentAmount === null || milestone.amount > currentAmount,
    )
    .sort((a, b) => a.amount - b.amount)[0]?.milestoneId;

  return (
    <Box
      sx={{
        maxHeight: { xs: 360, sm: 440, md: 520 },
        overflowY: "auto",
        pr: 0.5,
      }}
    >
      {error && <StatusAlert message={error} onClose={() => setError(null)} />}

      {loading ? (
        <Stack spacing={2}>
          <Skeleton
            variant="rectangular"
            height={48}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={48}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={48}
            sx={{ borderRadius: 1 }}
          />
        </Stack>
      ) : milestones.length === 0 ? (
        <EmptyState icon={<FlagOutlinedIcon />} message="No milestones yet." />
      ) : (
        <>
          <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {timeline.map(({ milestone: item, elapsedLabel }, index) => {
              const isLast = index === timeline.length - 1;
              const reached =
                currentAmount !== null && item.amount <= currentAmount;
              const dateLabel = formatMilestoneDate(item);
              return (
                <Box
                  component="li"
                  key={item.milestoneId}
                  sx={{ display: "flex", gap: 2 }}
                >
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
                    {reached ? (
                      <CheckCircleOutlineIcon
                        sx={{ color: "success.main", fontSize: 20 }}
                      />
                    ) : (
                      <RadioButtonCheckedIcon
                        sx={{ color: "primary.main", fontSize: 20 }}
                      />
                    )}
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

                  <Box sx={{ pb: isLast ? 0 : 2.5, flexGrow: 1, minWidth: 0 }}>
                    {elapsedLabel ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.75 }}
                      >
                        {elapsedLabel}
                      </Typography>
                    ) : null}
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1}
                    >
                      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                        >
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            lineHeight={1.2}
                          >
                            {fmt(item.amount)}
                          </Typography>
                          {reached ? (
                            <Chip
                              label="Reached"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ height: 22, fontSize: "0.7rem" }}
                            />
                          ) : (
                            <Chip
                              label={
                                item.milestoneId === nextUnreachedId
                                  ? "Next"
                                  : "Later"
                              }
                              size="small"
                              variant="outlined"
                              color={
                                item.milestoneId === nextUnreachedId
                                  ? "warning"
                                  : "default"
                              }
                              sx={{ height: 22, fontSize: "0.7rem" }}
                            />
                          )}
                        </Stack>

                        {dateLabel ||
                        (item.age !== null && item.age !== undefined) ? (
                          <Stack direction="row" spacing={1.5}>
                            {dateLabel ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {dateLabel}
                              </Typography>
                            ) : null}
                            {item.age !== null && item.age !== undefined ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Age {item.age}
                              </Typography>
                            ) : null}
                          </Stack>
                        ) : null}

                        {item.note ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontStyle: "italic" }}
                          >
                            {item.note}
                          </Typography>
                        ) : null}
                      </Stack>

                      <Stack direction="row" spacing={0.75}>
                        <ActionIconButton
                          tooltip="Edit"
                          ariaLabel={`Edit milestone for ${item.year ?? "no year"}`}
                          onClick={() => setEditCandidate(item)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </ActionIconButton>
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
                    </Stack>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete Milestone"
        message="Are you sure you want to delete this milestone? This action cannot be undone."
        confirmLabel="Delete"
        loading={isDeleting}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      />
      <ProgressEntryDialog
        open={Boolean(editCandidate)}
        title="Edit Milestone"
        onClose={() => setEditCandidate(null)}
      >
        {editCandidate ? (
          <MilestoneForm
            existingMilestone={editCandidate}
            onSaved={async () => {
              await onMilestonesChanged?.();
              setEditCandidate(null);
            }}
            onCancel={() => setEditCandidate(null)}
          />
        ) : null}
      </ProgressEntryDialog>
    </Box>
  );
}
