"use client";

import React from "react";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EmptyState from "@/components/ui/EmptyState";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { formatCurrencyWhole } from "@/lib/utils/format";
import { calculateFireNumber, generateProjection } from "@/lib/utils/fire";
import type { FireScenario } from "@/lib/types/types";

interface Props {
  scenarios: FireScenario[];
  activeScenarioId: string | undefined;
  onSelect: (scenario: FireScenario) => void;
  onNew: () => void;
  onDelete: (scenario: FireScenario) => Promise<void>;
}

export default function FireScenarioList({
  scenarios,
  activeScenarioId,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  const { candidate, requestDelete, confirmDelete, cancelDelete, isDeleting } =
    useDeleteConfirmation({ onConfirm: onDelete });

  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          Saved Scenarios
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={onNew}
          variant="outlined"
        >
          New
        </Button>
      </Stack>

      {scenarios.length === 0 ? (
        <Box sx={{ mb: 2 }}>
          <EmptyState
            icon={<InsightsOutlinedIcon />}
            message="No saved scenarios yet. Adjust the form and save your first one."
            variant="body2"
          />
        </Box>
      ) : (
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {scenarios.map((s) => {
            const fireNum = calculateFireNumber(
              s.annualExpenses,
              s.withdrawalRate,
            );
            const { summary } = generateProjection(s);
            const isActive = s.scenarioId === activeScenarioId;

            return (
              <Grid item xs={12} key={s.scenarioId}>
                <Card
                  variant={isActive ? "elevation" : "outlined"}
                  elevation={isActive ? 3 : 0}
                  sx={(theme) => ({
                    overflow: "hidden",
                    border: isActive ? 2 : 1,
                    borderColor: isActive ? "primary.main" : "divider",
                    transition: theme.transitions.create(
                      ["background-color", "border-color", "box-shadow"],
                      {
                        duration: theme.transitions.duration.shorter,
                      },
                    ),
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                    "&:focus-within": {
                      backgroundColor: theme.palette.action.hover,
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
                    },
                  })}
                >
                  <Stack direction="row" alignItems="stretch">
                    <CardActionArea
                      onClick={() => onSelect(s)}
                      aria-pressed={isActive}
                      sx={{
                        flex: 1,
                        alignSelf: "stretch",
                        borderRadius: 0,
                        backgroundColor: "transparent",
                        "&:hover": {
                          backgroundColor: "transparent",
                        },
                        "&.Mui-focusVisible": {
                          backgroundColor: "transparent",
                        },
                        "& .MuiCardActionArea-focusHighlight": {
                          display: "none",
                        },
                      }}
                    >
                      <CardContent sx={{ py: 1.5, px: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {s.name}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ mt: 0.5, flexWrap: "wrap", rowGap: 0.5 }}
                        >
                          <Chip
                            label={`FIRE: ${formatCurrencyWhole(fireNum)}`}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                          <Chip
                            label={
                              summary.yearsToFire !== null
                                ? `${summary.yearsToFire}yr`
                                : "N/A"
                            }
                            size="small"
                            color={
                              summary.yearsToFire !== null
                                ? "success"
                                : "default"
                            }
                            variant="outlined"
                          />
                          <Chip
                            label={`${(s.annualReturnRate * 100).toFixed(0)}% ret.`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        pr: 0.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          requestDelete(s);
                        }}
                        aria-label={`Delete ${s.name}`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={candidate !== null} onClose={cancelDelete}>
        <DialogTitle>Delete scenario?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &ldquo;{candidate?.name}&rdquo;?
            This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            disabled={isDeleting}
            variant="contained"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
