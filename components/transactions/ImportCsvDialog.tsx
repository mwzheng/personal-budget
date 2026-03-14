// Note 1: ImportCsvDialog implements a discriminated union state machine for the
// CSV import flow. The four stages -- idle, parsing, preview, error -- are
// modeled as a single `ImportState` union type instead of multiple boolean flags.
// This prevents impossible states (e.g. "parsing AND error at the same time").
"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useRef, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import type { Transaction } from "@/lib/types";

// Note 2: The discriminated union uses `stage` as the discriminant property.
// TypeScript can narrow the type based on `state.stage`, giving compile-time
// guarantees that `state.all` only exists when `stage === "preview"`.
type ImportState =
  | { stage: "idle" }
  | { stage: "parsing" }
  | {
      stage: "preview";
      csvText: string;
      all: Transaction[];
      sample: Transaction[];
    }
  | { stage: "error"; message: string };

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after the server import succeeds so the parent can refetch account data. */
  onImported: () => void;
}

export function ImportCsvDialog({ open, onClose, onImported }: Props) {
  const [state, setState] = useState<ImportState>({ stage: "idle" });
  const [confirming, setConfirming] = useState(false);
  // Note 3: `useRef` stores a reference to the hidden <input type="file"> element.
  // Unlike `useState`, updating a ref does not trigger a re-render.
  // It is used here to imperatively reset the file input value after each import
  // attempt, so the user can re-select the same file if needed.
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setState({ stage: "idle" });
    setConfirming(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setState({ stage: "parsing" });

    try {
      const text = await file.text();
      // Note 4: The dialog parses locally for preview only. The actual write
      // still happens on the server after the user confirms, which keeps the
      // imported rows tied to the authenticated Cognito account.
      const parsed = (await import("@/lib/csvParser")).loadTransactionsFromCSV(
        text,
      );

      setState({
        stage: "preview",
        csvText: text,
        all: parsed,
        sample: parsed.slice(0, 5),
      });
    } catch (err) {
      setState({
        stage: "error",
        message:
          err instanceof Error ? err.message : "Unknown error during import",
      });
    }
  }

  async function handleConfirm() {
    if (state.stage !== "preview") return;
    setConfirming(true);

    try {
      const res = await apiFetch("/api/reports/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: state.csvText }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          (data as { error?: { message?: string } }).error?.message ??
            `Import failed (${res.status})`,
        );
      }

      onImported();
      handleClose();
    } catch (err) {
      setState({
        stage: "error",
        message:
          err instanceof Error ? err.message : "Failed to import transactions",
      });
    } finally {
      setConfirming(false);
    }
  }

  const isParsing = state.stage === "parsing";
  const isPreview = state.stage === "preview";
  const isError = state.stage === "error";

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import CSV</DialogTitle>
      <DialogContent>
        {state.stage === "idle" && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Select a CSV file to import. The file must match the sample{" "}
              <code>expenses.csv</code> format:
            </Typography>
            <Typography
              component="pre"
              variant="caption"
              sx={{
                display: "block",
                bgcolor: "action.hover",
                borderRadius: 1,
                p: 1.5,
                mb: 2,
                overflow: "auto",
              }}
            >
              Name,Amount,Category,Date,Notes,Payment Method,Tags
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Imported rows are written to your signed-in account after you
              confirm the preview. Duplicate handling is managed server-side.
            </Typography>
          </Box>
        )}

        {isParsing && (
          <Box display="flex" alignItems="center" gap={2} py={2}>
            <CircularProgress size={24} />
            <Typography>Parsing CSV file…</Typography>
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {state.message}
          </Alert>
        )}

        {isPreview && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>{state.all.length}</strong> transaction
              {state.all.length !== 1 ? "s" : ""} ready to import. Click{" "}
              <strong>Confirm Import</strong> to save them to your account.
            </Alert>

            {state.sample.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Preview (first 5 rows):
                </Typography>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {state.sample.slice(0, 5).map((t, i) => (
                        <TableRow key={i}>
                          <TableCell>{t.date}</TableCell>
                          <TableCell>{t.name}</TableCell>
                          <TableCell>{t.category}</TableCell>
                          <TableCell align="right">
                            ${t.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isParsing || confirming}>
          Cancel
        </Button>

        {(state.stage === "idle" || isError) && (
          <Button
            variant="contained"
            component="label"
            disabled={isParsing || confirming}
          >
            Choose CSV File
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={handleFileChange}
            />
          </Button>
        )}

        {isPreview && (
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={confirming}
          >
            {confirming ? "Importing…" : "Confirm Import"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
