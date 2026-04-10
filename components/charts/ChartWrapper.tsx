"use client";

import React, { useCallback, useRef, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import DownloadIcon from "@mui/icons-material/Download";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { toPng } from "html-to-image";

import { StatusAlert } from "@/components/ui/StatusAlert";

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
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    const node = wrapperRef.current;
    if (!node) return;

    setExporting(true);
    setError(null);

    try {
      const dataUrl = await toPng(node, {
        backgroundColor: "#121212",
        pixelRatio: 2,
        cacheBust: true,
        // MUI/next/font styles can trigger a font-face parsing bug in
        // html-to-image; skipping font embedding keeps downloads reliable.
        skipFonts: true,
        filter: (domNode) => !domNode.classList?.contains(DOWNLOAD_BTN_CLASS),
      });
      const link = document.createElement("a");
      link.download = `${title.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Failed to download chart as PNG.",
      );
    } finally {
      setExporting(false);
    }
  }, [title]);

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {error ? (
        <StatusAlert message={error} onClose={() => setError(null)} />
      ) : null}
      <Box
        ref={wrapperRef}
        sx={{ position: "relative", width: "100%", height: "100%" }}
      >
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
    </Box>
  );
}
