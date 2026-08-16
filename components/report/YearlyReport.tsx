"use client";

import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { format, parseISO } from "date-fns";
import { toPng } from "html-to-image";
import { useCallback, useRef, useState } from "react";

import { SpendingBarChart } from "@/components/charts/SpendingBarChart";
import { YearSelector } from "@/components/report/YearSelector";
import StatCard from "@/components/report/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import type { YearlyReport as YearlyReportData } from "@/lib/types/types";
import {
  CATEGORY_CHIP_COLORS,
  TAG_CHART_PALETTE,
} from "@/lib/utils/categoryColors";
import { formatCurrency } from "@/lib/utils/format";

interface YearlyReportProps {
  report: YearlyReportData;
  availableYears: string[];
  currentYear: number;
  onYearChange: (year: number) => void;
}

function formatMonth(period: string): string {
  return format(parseISO(`${period}-01`), "MMMM");
}

export function YearlyReport({
  report,
  availableYears,
  currentYear,
  onYearChange,
}: YearlyReportProps) {
  const reportRef = useRef<HTMLElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const isEmpty = report.transactionCount === 0;
  const highestSpendMonth = report.highestSpendMonth;
  const maxTagAmount = report.topTags[0]?.value ?? 0;

  const handleDownloadImage = useCallback(async () => {
    if (!reportRef.current) return;

    setDownloading(true);
    setDownloadError(null);
    try {
      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: "#0B1B26",
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
        filter: (node) => !node.classList?.contains("yearly-report__controls"),
      });
      const link = document.createElement("a");
      link.download = `porridge-${report.year}-yearly-report.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : "Failed to download report image.",
      );
    } finally {
      setDownloading(false);
    }
  }, [report.year]);

  return (
    <section
      ref={reportRef}
      className="yearly-report"
      aria-labelledby="yearly-report-heading"
    >
      <SectionCard
        title="Yearly Report"
        description={`Calendar-year overview for ${report.year}${report.year === currentYear ? " through the current month" : ""}.`}
        headingId="yearly-report-heading"
        elevation={1}
        action={
          <Stack
            className="yearly-report__controls"
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <YearSelector
              availableYears={availableYears}
              selectedYear={report.year}
              currentYear={currentYear}
              onChange={onYearChange}
            />
            <Tooltip title="Download report" placement="bottom">
              <span>
                <IconButton
                  className="yearly-report__download"
                  onClick={handleDownloadImage}
                  disabled={downloading}
                  aria-label={`Download ${report.year} report`}
                  size="small"
                >
                  {downloading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <DownloadOutlinedIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        }
      >
        {downloadError ? (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {downloadError}
          </Typography>
        ) : null}
        {isEmpty ? (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <Typography variant="body1" fontWeight={600}>
              No transactions for {report.year}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Choose another year or add transactions to begin this report.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={3}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(3, minmax(0, 1fr))",
                  lg: "repeat(6, minmax(0, 1fr))",
                },
                gap: 1.5,
              }}
            >
              <StatCard
                label="Income"
                value={formatCurrency(report.incomeAmount)}
                color="#26a69a"
                loading={false}
              />
              <StatCard
                label="Spending"
                value={formatCurrency(report.spendingAmount)}
                color="text.primary"
                loading={false}
              />
              <StatCard
                label="Savings"
                value={formatCurrency(report.savingsAmount)}
                color="#15803D"
                loading={false}
              />
              <StatCard
                label="Savings rate"
                value={
                  report.savingsRate === null
                    ? "—"
                    : `${report.savingsRate.toFixed(1)}%`
                }
                color="text.primary"
                loading={false}
              />
              <StatCard
                label="Transactions"
                value={String(report.transactionCount)}
                color="text.primary"
                loading={false}
              />
              <StatCard
                label="Avg. monthly spending"
                value={formatCurrency(report.averageMonthlySpending)}
                color="text.primary"
                loading={false}
              />
            </Box>

            <Box className="yearly-report__chart">
              <SpendingBarChart data={report.months} />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 1.5,
              }}
            >
              <SectionCard
                title="Highest-spend month"
                headingId="yearly-highest-month-heading"
                elevation={0}
              >
                <Typography variant="h6" className="financial-value">
                  {highestSpendMonth
                    ? formatMonth(highestSpendMonth.period)
                    : "—"}
                </Typography>
                <Typography color="text.secondary">
                  {highestSpendMonth
                    ? formatCurrency(highestSpendMonth.spendingAmount)
                    : "No spending recorded"}
                </Typography>
              </SectionCard>
              <SectionCard
                title="Largest purchase"
                headingId="yearly-largest-purchase-heading"
                elevation={0}
              >
                <Typography variant="h6" noWrap>
                  {report.largestPurchase?.name ?? "—"}
                </Typography>
                <Typography color="text.secondary">
                  {report.largestPurchase
                    ? formatCurrency(report.largestPurchase.amount)
                    : "No spending recorded"}
                </Typography>
              </SectionCard>
              <SectionCard
                title="Category totals"
                headingId="yearly-category-totals-heading"
                elevation={0}
              >
                <Stack spacing={0.75}>
                  {(["Need", "Want", "Saving"] as const).map((category) => (
                    <Stack
                      key={category}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Chip
                        size="small"
                        label={`${category}s`}
                        color={CATEGORY_CHIP_COLORS[category]}
                      />
                      <Typography className="financial-value">
                        {formatCurrency(report.totalByCategoryType[category])}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </SectionCard>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "4fr 8fr" },
                gap: 1.5,
              }}
            >
              <SectionCard
                title="Top tags"
                headingId="yearly-top-tags-heading"
                description="Where tagged outflows were concentrated"
                titleAlign="left"
                elevation={0}
              >
                {report.topTags.length ? (
                  <Stack
                    spacing={1.25}
                    role="list"
                    aria-label="Top spending tags"
                  >
                    {report.topTags.map((tag, index) => {
                      const width = maxTagAmount
                        ? `${Math.max(8, (tag.value / maxTagAmount) * 100)}%`
                        : "0%";

                      return (
                        <Box key={tag.name} role="listitem">
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 0.5 }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ minWidth: 0 }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ width: 18, textAlign: "right" }}
                              >
                                {index + 1}
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                noWrap
                                title={tag.name}
                              >
                                {tag.name}
                              </Typography>
                            </Stack>
                            <Typography
                              variant="body2"
                              className="financial-value"
                              sx={{ flexShrink: 0 }}
                            >
                              {formatCurrency(tag.value)}
                            </Typography>
                          </Stack>
                          <Box
                            sx={{
                              height: 6,
                              ml: 3.75,
                              borderRadius: 999,
                              bgcolor: "action.hover",
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                width,
                                height: "100%",
                                borderRadius: 999,
                                bgcolor:
                                  TAG_CHART_PALETTE[
                                    index % TAG_CHART_PALETTE.length
                                  ],
                              }}
                            />
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">
                    No tagged spending.
                  </Typography>
                )}
              </SectionCard>
              <SectionCard
                title="Monthly detail"
                headingId="yearly-monthly-detail-heading"
                elevation={0}
              >
                <TableContainer>
                  <Table
                    size="small"
                    aria-label={`${report.year} monthly spending detail`}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell align="right">Needs</TableCell>
                        <TableCell align="right">Wants</TableCell>
                        <TableCell align="right">Savings</TableCell>
                        <TableCell align="right">Income</TableCell>
                        <TableCell align="right">Transactions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.months.map((month) => (
                        <TableRow key={month.period}>
                          <TableCell>{formatMonth(month.period)}</TableCell>
                          <TableCell align="right" data-numeric="true">
                            {formatCurrency(month.Need)}
                          </TableCell>
                          <TableCell align="right" data-numeric="true">
                            {formatCurrency(month.Want)}
                          </TableCell>
                          <TableCell align="right" data-numeric="true">
                            {formatCurrency(month.Saving)}
                          </TableCell>
                          <TableCell align="right" data-numeric="true">
                            {formatCurrency(month.incomeAmount)}
                          </TableCell>
                          <TableCell align="right" data-numeric="true">
                            {month.transactionCount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </SectionCard>
            </Box>
          </Stack>
        )}
      </SectionCard>
    </section>
  );
}
