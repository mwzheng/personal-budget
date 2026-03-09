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
import { appendTransactions } from "@/lib/storage";

// Note 2: The discriminated union uses `stage` as the discriminant property.
// TypeScript can narrow the type based on `state.stage`, giving compile-time
// guarantees that `state.all` only exists when `stage === "preview"`.
type ImportState =
  | { stage: "idle" }
  | { stage: "parsing" }
  | { stage: "preview"; all: Transaction[]; sample: Transaction[] }
  | { stage: "error"; message: string };

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after the user confirms import and rows are saved to localStorage. */
  onImported: () => void;
}

export function ImportCsvDialog({ open, onClose, onImported }: Props) {
  const [state, setState] = useState<ImportState>({ stage: "idle" });
  // Note 3: `useRef` stores a reference to the hidden <input type="file"> element.
  // Unlike `useState`, updating a ref does not trigger a re-render.
  // It is used here to imperatively reset the file input value after each import
  // attempt, so the user can re-select the same file if needed.
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setState({ stage: "idle" });
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
      // Note 4: The server-first strategy sends the CSV to `/api/reports/import`
      // which saves rows directly to DynamoDB. If auth is not configured or the
      // server errors out, the catch block falls back to client-side parsing
      // via `csvParser` and saves to localStorage instead.
      let data: {
        importedCount: number;
        transactions: Transaction[];
        sample: Transaction[];
      } | null = null;
      try {
        const res = await apiFetch("/api/reports/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csv: text }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { error?: { message?: string } }).error?.message ??
              `Parse failed (${res.status})`,
          );
        }
        data = (await res.json()) as any;
      } catch (err) {
        // Note 5: Dynamic `import("@/lib/csvParser")` loads the parser module on
        // demand. This keeps it out of the initial bundle since it is only needed
        // when the user actually selects a file and the server import fails.
        console.warn(
          "Server import failed, falling back to client-side parse",
          err,
        );
        const parsed = (
          await import("@/lib/csvParser")
        ).loadTransactionsFromCSV(text);
        data = {
          importedCount: parsed.length,
          transactions: parsed,
          sample: parsed.slice(0, 5),
        };
      }

      if (!data) {
        setState({
          stage: "error",
          message: "Import failed: no data returned from import",
        });
        return;
      }

      setState({
        stage: "preview",
        all: data.transactions,
        sample: data.sample,
      });
    } catch (err) {
      setState({
        stage: "error",
        message:
          err instanceof Error ? err.message : "Unknown error during import",
      });
    }
  }

  function handleConfirm() {
    if (state.stage !== "preview") return;
    const { appended, skipped } = appendTransactions(state.all);
    onImported();
    handleClose();
    // Slight delay so the parent re-renders with fresh data before dialog fully unmounts
    void appended;
    void skipped;
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
              Imported rows are <strong>appended</strong> to your existing data.
              Duplicate rows (same date, name, and amount) are automatically
              skipped.
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
              <strong>Confirm Import</strong> to append them to your data.
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
        <Button onClick={handleClose} disabled={isParsing}>
          Cancel
        </Button>

        {(state.stage === "idle" || isError) && (
          <Button variant="contained" component="label" disabled={isParsing}>
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
          <Button variant="contained" onClick={handleConfirm}>
            Confirm Import
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
