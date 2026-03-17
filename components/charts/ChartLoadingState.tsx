/**
 * Note 1: This shared loading state keeps chart cards visually stable while data
 * is fetching. Reusing one component avoids slightly different skeleton heights
 * or legend spacing across Reports and other chart-heavy screens.
 */

"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

interface Props {
  height: number;
  legendItems?: number;
  showLegend?: boolean;
}

export function ChartLoadingState({
  height,
  legendItems = 3,
  showLegend = true,
}: Props) {
  return (
    <Stack spacing={2.5}>
      <Skeleton
        variant="rounded"
        animation="wave"
        height={height}
        sx={{ borderRadius: 2 }}
      />
      {showLegend ? (
        <Stack
          direction="row"
          justifyContent="center"
          spacing={2}
          useFlexGap
          flexWrap="wrap"
        >
          {Array.from({ length: legendItems }, (_, index) => (
            <Box
              key={`chart-loading-legend-${index}`}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <Skeleton variant="circular" width={12} height={12} />
              <Skeleton variant="text" width={72} />
            </Box>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
