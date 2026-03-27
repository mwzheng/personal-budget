"use client";

import React from "react";
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
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No saved scenarios yet. Adjust the form and save your first one.
        </Typography>
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
                  sx={{
                    border: isActive ? 2 : 1,
                    borderColor: isActive ? "primary.main" : "divider",
                  }}
                >
                  <CardActionArea onClick={() => onSelect(s)}>
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="subtitle2" fontWeight={600}>
                          {s.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            requestDelete(s);
                          }}
                          aria-label={`Delete ${s.name}`}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
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
                            summary.yearsToFire !== null ? "success" : "default"
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
