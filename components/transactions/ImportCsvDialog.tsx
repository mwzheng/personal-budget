// Note 1: ImportCsvDialog implements a discriminated union state machine for the
// CSV import flow. The four stages -- idle, parsing, preview, error -- are
// modeled as a single `ImportState` union type instead of multiple boolean flags.
// This prevents impossible states (e.g. "parsing AND error at the same time").
"use client";

import { StatusAlert } from "@/components/ui/StatusAlert";
import { apiFetch } from "@/lib/api/apiFetch";
import type { Transaction } from "@/lib/types/types";
import CloseIcon from "@mui/icons-material/Close";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useRef, useState } from "react";

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

const EXPENSES_TEMPLATE_PATH = "/templates/expenses-template.csv";
const INCOME_TEMPLATE_PATH = "/templates/income-template.csv";

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
      const parsed = (
        await import("@/lib/utils/csvParser")
      ).loadTransactionsFromCSV(text);

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
  const canChooseFile = state.stage === "idle" || isError;
  const footerMessage = isPreview
    ? "Your data is only written after you confirm the preview."
    : "Download a template in the dialog, then choose a CSV to preview it.";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="import-csv-title"
      aria-describedby="import-csv-description"
    >
      <DialogTitle
        id="import-csv-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700} component="span">
            Import CSV
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Preview transactions before importing them into your account.
          </Typography>
        </Box>
        <IconButton
          aria-label="Close import dialog"
          onClick={handleClose}
          size="small"
          disabled={isParsing || confirming}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent
        id="import-csv-description"
        sx={{ pt: 2.5, px: { xs: 2, sm: 3 } }}
      >
        {state.stage === "idle" && (
          <Stack spacing={2.5}>
            <Card
              variant="outlined"
              sx={{
                borderColor: "divider",
                bgcolor: "rgba(255,255,255,0.03)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ sm: "center" }}
                  sx={{ mb: 1.5 }}
                >
                  <Chip
                    label="Expense CSV"
                    size="small"
                    sx={{
                      width: "fit-content",
                      bgcolor: "rgba(102, 187, 106, 0.12)",
                      color: "#81c784",
                    }}
                  />
                  <Chip
                    label="Income CSV"
                    size="small"
                    sx={{
                      width: "fit-content",
                      bgcolor: "rgba(38, 166, 154, 0.12)",
                      color: "#4db6ac",
                    }}
                  />
                </Stack>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Upload a supported transaction export.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The reports page supports both the expense schema (`Name,
                  Amount, Category, Date, Notes, Payment Method, Tags`) and the
                  income schema (`Source, Amount, Pay Date`).
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderColor: "divider" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Starter templates
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Download a template if you need a clean file format to begin
                  with.
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  alignItems={{ sm: "center" }}
                  sx={{ mb: 2 }}
                >
                  <Button
                    component="a"
                    href={EXPENSES_TEMPLATE_PATH}
                    download
                    variant="outlined"
                    startIcon={<DownloadOutlinedIcon />}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Expense template
                  </Button>
                  <Button
                    component="a"
                    href={INCOME_TEMPLATE_PATH}
                    download
                    variant="outlined"
                    startIcon={<DownloadOutlinedIcon />}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Income template
                  </Button>
                </Stack>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "action.hover",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{ display: "block" }}
                    >
                      Expense
                    </Typography>
                    <Typography
                      component="code"
                      variant="body2"
                      sx={{
                        fontFamily: "ui-monospace, SFMono-Regular, monospace",
                        color: "text.secondary",
                        display: "block",
                        mt: 0.5,
                      }}
                    >
                      Name,Amount,Category,Date,Notes,Payment Method,Tags
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "action.hover",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{ display: "block" }}
                    >
                      Income
                    </Typography>
                    <Typography
                      component="code"
                      variant="body2"
                      sx={{
                        fontFamily: "ui-monospace, SFMono-Regular, monospace",
                        color: "text.secondary",
                        display: "block",
                        mt: 0.5,
                      }}
                    >
                      Source,Amount,Pay Date
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card
              variant="outlined"
              sx={{
                borderColor: "divider",
                bgcolor: "rgba(255,255,255,0.02)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  What happens next
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Imported rows are written to your signed-in account only after
                  you confirm the preview. Duplicate handling is managed
                  server-side.
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        )}

        {isParsing && (
          <Card
            variant="outlined"
            sx={{
              borderColor: "divider",
              bgcolor: "rgba(255,255,255,0.03)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <CircularProgress size={28} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Parsing CSV file…
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Validating columns and building a preview before import.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}

        {isError && (
          <Stack spacing={2}>
            <StatusAlert message={state.message} sx={{ mt: 0, mb: 0 }} />
            <Card
              variant="outlined"
              sx={{
                borderColor: "divider",
                bgcolor: "rgba(255,255,255,0.02)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Try a different file
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Check the column headers, or download one of the supported
                  templates before importing again.
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  alignItems={{ sm: "center" }}
                >
                  <Button
                    component="a"
                    href={EXPENSES_TEMPLATE_PATH}
                    download
                    variant="outlined"
                    startIcon={<DownloadOutlinedIcon />}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Expense template
                  </Button>
                  <Button
                    component="a"
                    href={INCOME_TEMPLATE_PATH}
                    download
                    variant="outlined"
                    startIcon={<DownloadOutlinedIcon />}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Income template
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}

        {isPreview && (
          <Stack spacing={2}>
            <Card
              variant="outlined"
              sx={{
                borderColor: "divider",
                bgcolor: "rgba(255,255,255,0.03)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  sx={{ mb: 2 }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Preview ready
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Review the first few rows before importing everything.
                    </Typography>
                  </Box>
                  <Chip
                    label={`${state.all.length} row${state.all.length !== 1 ? "s" : ""}`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(38, 166, 154, 0.14)",
                      color: "#4db6ac",
                    }}
                  />
                </Stack>
                <StatusAlert
                  message={`${state.all.length} transaction${state.all.length !== 1 ? "s" : ""} ready to import. Click "Confirm Import" to save them to your account.`}
                  severity="info"
                  sx={{ mb: 0 }}
                />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                    mt: 2,
                  }}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      borderColor: "divider",
                      bgcolor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Transactions detected
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {state.all.length}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card
                    variant="outlined"
                    sx={{
                      borderColor: "divider",
                      bgcolor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Preview rows shown
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {state.sample.length}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card
                    variant="outlined"
                    sx={{
                      borderColor: "divider",
                      bgcolor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Destination
                      </Typography>
                      <Typography variant="body1" fontWeight={700}>
                        Signed-in account
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </CardContent>
            </Card>

            {state.sample.length > 0 && (
              <Card variant="outlined" sx={{ borderColor: "divider" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Sample rows
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Showing the first {state.sample.length} row
                    {state.sample.length !== 1 ? "s" : ""} from the file.
                  </Typography>
                  <Box
                    sx={{
                      overflowX: "auto",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Table size="small">
                      <TableHead
                        sx={{
                          bgcolor: "rgba(255,255,255,0.04)",
                          "& .MuiTableCell-root": {
                            borderColor: "divider",
                            color: "text.secondary",
                            fontWeight: 600,
                          },
                        }}
                      >
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {state.sample.slice(0, 5).map((t, i) => (
                          <TableRow
                            key={i}
                            sx={{
                              "& .MuiTableCell-root": {
                                borderColor: "divider",
                              },
                            }}
                          >
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
                </CardContent>
              </Card>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          gap: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: { xs: "none", sm: "block" } }}
        >
          {footerMessage}
        </Typography>
        <Stack
          direction={{ xs: "column-reverse", sm: "row" }}
          spacing={1}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Button
            onClick={handleClose}
            disabled={isParsing || confirming}
            color="inherit"
          >
            Cancel
          </Button>

          {canChooseFile && (
            <Button
              variant="contained"
              component="label"
              disabled={isParsing || confirming}
              startIcon={<UploadFileOutlinedIcon />}
            >
              {isError ? "Choose Another CSV" : "Choose CSV File"}
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
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
