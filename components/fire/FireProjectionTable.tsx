"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { formatCurrencyWhole } from "@/lib/utils/format";
import type { FireProjectionRow } from "@/lib/types/types";

interface Props {
  rows: FireProjectionRow[];
}

const COLLAPSED_ROW_COUNT = 10;

export default function FireProjectionTable({ rows }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          No projection data to display.
        </Typography>
      </Box>
    );
  }

  const visibleRows =
    expanded || rows.length <= COLLAPSED_ROW_COUNT
      ? rows
      : rows.slice(0, COLLAPSED_ROW_COUNT);
  const canExpand = rows.length > COLLAPSED_ROW_COUNT;

  return (
    <Box>
      <TableContainer sx={{ maxHeight: expanded ? 600 : undefined }}>
        <Table size="small" stickyHeader aria-label="FIRE projection table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Year</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Start Balance
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Contributions
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Growth
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                End Balance
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                End (Real)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                FIRE Target
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((row) => {
              const isFireYear =
                row.isFIREd &&
                (row.year === 0 ||
                  !rows[row.year - 1] ||
                  !rows[row.year - 1].isFIREd);
              return (
                <TableRow
                  key={row.calendarYear}
                  sx={{
                    bgcolor: isFireYear ? "rgba(76, 175, 80, 0.08)" : undefined,
                  }}
                >
                  <TableCell>{row.calendarYear}</TableCell>
                  <TableCell align="right">
                    {formatCurrencyWhole(row.startBalance)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrencyWhole(row.contributions)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrencyWhole(row.growth)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrencyWhole(row.endBalance)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrencyWhole(row.endBalanceReal)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrencyWhole(row.fireNumber)}
                  </TableCell>
                  <TableCell align="center">
                    {row.isFIREd ? (
                      <Chip
                        label="🔥 FIRE"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {canExpand && (
        <Collapse in={!expanded}>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
            <IconButton
              size="small"
              onClick={() => setExpanded(true)}
              aria-label={`Show all ${rows.length} years`}
            >
              <KeyboardArrowDownIcon />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                Show all {rows.length} years
              </Typography>
            </IconButton>
          </Box>
        </Collapse>
      )}
      {canExpand && expanded && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
          <IconButton
            size="small"
            onClick={() => setExpanded(false)}
            aria-label="Collapse table"
          >
            <KeyboardArrowUpIcon />
            <Typography variant="caption" sx={{ ml: 0.5 }}>
              Show less
            </Typography>
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
