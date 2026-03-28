"use client";

import React, { useCallback, useRef, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import DownloadIcon from "@mui/icons-material/Download";
import { toPng } from "html-to-image";

interface Props {
  /** Used as the downloaded PNG filename (no extension). */
  title: string;
  children: React.ReactNode;
}

const DOWNLOAD_BTN_CLASS = "chart-download-btn";

/**
 * Wraps a chart component and overlays a small download-as-PNG button in the
 * top-right corner. The button hides itself from the captured image so the
 * exported PNG stays clean.
 */
export function ChartWrapper({ title, children }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleDownload = useCallback(async () => {
    const node = wrapperRef.current;
    if (!node) return;

    setExporting(true);
    // Hide the button before capture
    const buttons = node.querySelectorAll<HTMLElement>(
      `.${DOWNLOAD_BTN_CLASS}`,
    );
    buttons.forEach((btn) => (btn.style.display = "none"));

    try {
      const dataUrl = await toPng(node, {
        backgroundColor: "#121212",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `${title.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      buttons.forEach((btn) => (btn.style.display = ""));
      setExporting(false);
    }
  }, [title]);

  return (
    <Box ref={wrapperRef} sx={{ position: "relative" }}>
      {children}
      <Tooltip title="Download as PNG" placement="left">
        <IconButton
          className={DOWNLOAD_BTN_CLASS}
          onClick={handleDownload}
          disabled={exporting}
          size="small"
          aria-label={`Download ${title} chart as PNG`}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            opacity: exporting ? 1 : 0.4,
            transition: "opacity 0.2s",
            "&:hover": { opacity: 1 },
            bgcolor: "rgba(0,0,0,0.3)",
            color: "text.secondary",
            "&:hover, &:focus-visible": {
              bgcolor: "rgba(0,0,0,0.5)",
              color: "text.primary",
            },
          }}
        >
          {exporting ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <DownloadIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
