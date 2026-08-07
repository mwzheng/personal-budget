"use client";

import React from "react";
import { Box, Typography, useTheme } from "@mui/material";

interface Props {
  /** Current saved amount. */
  current: number | null;
  /** Target goal amount. */
  target: number | null;
  /** Width/height of the SVG viewBox. */
  size?: number;
}

/**
 * Semi-circular gauge that fills from left (0%) to right (100%).
 * The arc uses the theme's primary color for the fill and a muted
 * track color for the background. The percentage is displayed in the
 * center of the arc.
 */
export default function GoalGauge({ current, target, size = 220 }: Props) {
  const theme = useTheme();

  const pct =
    current !== null && target !== null && target > 0
      ? Math.round((current / target) * 10000) / 100
      : null;
  const clampedPct = pct !== null ? Math.min(Math.max(pct, 0), 100) : 0;

  // SVG geometry: semi-circle arc from 180° (left) to 0° (right).
  const cx = size / 2;
  const cy = size / 2 + 10; // shift down slightly so the arc sits naturally
  const radius = size / 2 - 16;
  const strokeWidth = 14;

  // Arc path helper — draws a circular arc between two angles.
  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  };

  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const sweep = startAngle - endAngle;
    const largeArc = sweep > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  // Track (full background arc from 180° to 0°)
  const trackPath = describeArc(180, 0);
  // Fill arc — proportional to clampedPct
  const fillEndAngle = 180 - clampedPct * 1.8; // 180° span mapped to 0–100%
  const fillPath = clampedPct > 0 ? describeArc(180, fillEndAngle) : "";

  const trackColor = theme.palette.divider;
  const fillColor = theme.palette.primary.main;

  // Needle tip position
  const needleAngle = 180 - clampedPct * 1.8;
  const needleTip = polarToCartesian(needleAngle);
  const needleBaseRadius = 4;
  const needleBase1 = {
    x: cx + needleBaseRadius * Math.cos(((needleAngle + 90) * Math.PI) / 180),
    y: cy - needleBaseRadius * Math.sin(((needleAngle + 90) * Math.PI) / 180),
  };
  const needleBase2 = {
    x: cx + needleBaseRadius * Math.cos(((needleAngle - 90) * Math.PI) / 180),
    y: cy - needleBaseRadius * Math.sin(((needleAngle - 90) * Math.PI) / 180),
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
      role="progressbar"
      aria-valuenow={pct ?? 0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Goal progress"
    >
      <svg
        viewBox={`0 0 ${size} ${size * 0.65}`}
        width={size}
        height={size * 0.65}
        style={{ overflow: "visible" }}
        aria-hidden="true"
      >
        {/* Track arc */}
        <path
          d={trackPath}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Fill arc */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={fillColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${fillColor}40)`,
            }}
          />
        )}

        {/* Needle */}
        {clampedPct > 0 && (
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
            fill={fillColor}
          />
        )}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={5} fill={fillColor} />
      </svg>

      {/* Percentage label centered below the arc */}
      <Box
        sx={{
          position: "absolute",
          top: "55%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        <Typography variant="h3" fontWeight={700} lineHeight={1}>
          {pct !== null ? `${pct}%` : "—"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          of goal
        </Typography>
      </Box>
    </Box>
  );
}
