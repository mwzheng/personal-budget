'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import { useState } from 'react';
import { CategoryType, Transaction } from '@/lib/types';

const CATEGORY_COLORS: Record<CategoryType, 'error' | 'info' | 'success'> = {
  Need: 'error',
  Want: 'info',
  Saving: 'success',
};

type SortField = 'date' | 'name' | 'amount' | 'category';
type SortDir = 'asc' | 'desc';

interface Props {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: Props) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  }

  const sorted = [...transactions].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'date') cmp = a.date.localeCompare(b.date);
    else if (sortField === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortField === 'amount') cmp = a.amount - b.amount;
    else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const paged = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper>
      <TableContainer sx={{ maxHeight: 520 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'date'}
                  direction={sortField === 'date' ? sortDir : 'asc'}
                  onClick={() => handleSort('date')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'name'}
                  direction={sortField === 'name' ? sortDir : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'category'}
                  direction={sortField === 'category' ? sortDir : 'asc'}
                  onClick={() => handleSort('category')}
                >
                  Category
                </TableSortLabel>
              </TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'amount'}
                  direction={sortField === 'amount' ? sortDir : 'asc'}
                  onClick={() => handleSort('amount')}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{t.date}</TableCell>
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
                  sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}
                >
                  ${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell
                  sx={{
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'text.secondary',
                    fontSize: 12,
                  }}
                >
                  {t.notes}
                </TableCell>
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
  );
}
