// Note 1: TransactionsTable is a pure presentational component. It receives data
// from its parent (ReportsPage) and exposes optional `onEdit`/`onDelete` callbacks
// rather than managing data itself. This separation keeps the component reusable
// and keeps network logic in the page.
"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useState } from "react";
import { CategoryType, Transaction } from "@/lib/types";

// Note 2: CATEGORY_COLORS maps each CategoryType to a MUI `color` token.
// MUI `Chip` only accepts a restricted set of named colors. Mapping here keeps
// the visual encoding consistent with other charts ("error"=red for Needs, etc.).
const CATEGORY_COLORS: Record<CategoryType, "error" | "info" | "success"> = {
  Need: "error",
  Want: "info",
  Saving: "success",
};

type SortField = "date" | "name" | "amount" | "category";
type SortDir = "asc" | "desc";

interface Props {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function TransactionsTable({ transactions, onEdit, onDelete }: Props) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  // Note 3: `deleteTarget` stores the transaction to be deleted so the
  // confirmation dialog can show its name and amount. Using state (vs a ref)
  // triggers a render that opens the Dialog when set to a non-null value.
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  function handleSort(field: SortField) {
    if (sortField === field) {
      // Note 4: Toggling direction on repeated clicks of the same column header
      // is standard sort UX. Clicking a new column always resets to descending
      // (most recent or largest value first).
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(0);
  }

  // Note 5: `[...transactions]` creates a shallow copy before sorting so the
  // original prop array is not mutated. React props should be treated as read-only.
  const sorted = [...transactions].sort((a, b) => {
    let cmp = 0;
    if (sortField === "date") cmp = a.date.localeCompare(b.date);
    else if (sortField === "name") cmp = a.name.localeCompare(b.name);
    else if (sortField === "amount") cmp = a.amount - b.amount;
    else if (sortField === "category")
      cmp = a.category.localeCompare(b.category);
    return sortDir === "asc" ? cmp : -cmp;
  });

  // Note 6: Client-side pagination with `slice` is fine here because all data
  // is already in memory (loaded from localStorage). For server-side data,
  // you would pass `page`/`rowsPerPage` as query params to the API instead.
  const paged = sorted.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
  const showActions = Boolean(onEdit || onDelete);

  return (
    <>
      <Paper>
        <TableContainer sx={{ maxHeight: 520 }}>
          {/* Note 7: `stickyHeader` keeps column headers visible while scrolling
              a long list. The container must have a fixed `maxHeight` for this to work. */}
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "date"}
                    direction={sortField === "date" ? sortDir : "asc"}
                    onClick={() => handleSort("date")}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "name"}
                    direction={sortField === "name" ? sortDir : "asc"}
                    onClick={() => handleSort("name")}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "category"}
                    direction={sortField === "category" ? sortDir : "asc"}
                    onClick={() => handleSort("category")}
                  >
                    Category
                  </TableSortLabel>
                </TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === "amount"}
                    direction={sortField === "amount" ? sortDir : "asc"}
                    onClick={() => handleSort("amount")}
                  >
                    Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell>Notes</TableCell>
                {showActions && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{t.date}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={t.category}
                      size="small"
                      color={CATEGORY_COLORS[t.category]}
                    />
                  </TableCell>
                  <TableCell>{t.paymentMethod}</TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {t.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 11 }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ whiteSpace: "nowrap", fontWeight: 600 }}
                  >
                    $
                    {t.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "text.secondary",
                      fontSize: 12,
                    }}
                  >
                    {t.notes}
                  </TableCell>
                  {showActions && (
                    <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                      {onEdit && (
                        <IconButton
                          size="small"
                          aria-label={`Edit ${t.name}`}
                          onClick={() => onEdit(t)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      )}
                      {onDelete && (
                        <IconButton
                          size="small"
                          aria-label={`Delete ${t.name}`}
                          color="error"
                          onClick={() => setDeleteTarget(t)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={transactions.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>

      {/* Note 8: The delete dialog is rendered outside the table in the same
          React Fragment so it is not nested inside a <table> element (which
          would be invalid HTML). `Boolean(deleteTarget)` drives the `open` prop. */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Transaction?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo; (
            {deleteTarget?.date}, ${deleteTarget?.amount.toFixed(2)})? This
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (deleteTarget && onDelete) {
                onDelete(deleteTarget.id);
              }
              setDeleteTarget(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
