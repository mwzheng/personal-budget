// Note 1: TransactionsTable is a pure presentational component. It receives data
// from its parent (ReportsPage) and exposes optional `onEdit`/`onDelete` callbacks
// rather than managing data itself. This separation keeps the component reusable
// and keeps network logic in the page.
"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ActionIconButton } from "@/components/ui/ActionIconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import { useEffect, useState } from "react";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { Transaction } from "@/lib/types/types";
import { TRANSACTION_CATEGORY_CHIP_COLORS } from "@/lib/utils/categoryColors";

type SortField = "date" | "name" | "amount" | "category";
type SortDir = "asc" | "desc";

interface Props {
  transactions: Transaction[];
  activeTags?: string[];
  onEdit?: (transaction: Transaction) => void;
  onDuplicate?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void | Promise<boolean>;
  onTagClick?: (tag: string) => void;
}

export function TransactionsTable({
  transactions,
  activeTags = [],
  onEdit,
  onDuplicate,
  onDelete,
  onTagClick,
}: Props) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  // Note 3: The delete confirmation hook manages the two-step delete flow:
  // clicking Delete sets the candidate, and the ConfirmDialog calls confirmDelete
  // only after the user explicitly confirms.
  const {
    candidate: deleteTarget,
    requestDelete,
    confirmDelete,
    cancelDelete,
    isDeleting,
  } = useDeleteConfirmation<Transaction>({
    onConfirm: async (item) => {
      if (onDelete) {
        await onDelete(item.id);
      }
    },
  });

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
  const activeTagSet = new Set(activeTags);
  const showActions = Boolean(onEdit || onDuplicate || onDelete);

  useEffect(() => {
    setPage(0);
  }, [transactions]);

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
                      color={TRANSACTION_CATEGORY_CHIP_COLORS[t.category]}
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
                          color={activeTagSet.has(tag) ? "primary" : "default"}
                          variant={
                            activeTagSet.has(tag) ? "filled" : "outlined"
                          }
                          onClick={
                            onTagClick ? () => onTagClick(tag) : undefined
                          }
                          sx={{
                            fontSize: 11,
                            cursor: onTagClick ? "pointer" : "default",
                          }}
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
                      <Stack
                        direction="row"
                        justifyContent="center"
                        spacing={0.75}
                      >
                        {onEdit ? (
                          <ActionIconButton
                            tooltip="Edit"
                            ariaLabel={`Edit transaction ${t.name}`}
                            onClick={() => onEdit(t)}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </ActionIconButton>
                        ) : null}
                        {onDuplicate ? (
                          <ActionIconButton
                            tooltip="Duplicate"
                            ariaLabel={`Duplicate transaction ${t.name}`}
                            onClick={() => onDuplicate(t)}
                          >
                            <ContentCopyOutlinedIcon fontSize="small" />
                          </ActionIconButton>
                        ) : null}
                        {onDelete ? (
                          <ActionIconButton
                            tooltip="Delete"
                            ariaLabel={`Delete transaction ${t.name}`}
                            tone="danger"
                            onClick={() => requestDelete(t)}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </ActionIconButton>
                        ) : null}
                      </Stack>
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
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Transaction?"
        message={`Are you sure you want to delete "${deleteTarget?.name}" (${deleteTarget?.date}, $${deleteTarget?.amount.toFixed(2)})? This cannot be undone.`}
        confirmLabel="Delete"
        loading={isDeleting}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      />
    </>
  );
}
