import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export interface SectionCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  elevation?: 0 | 1 | 2;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  headingId?: string;
}

export default function SectionCard({
  title,
  description,
  action,
  children,
  elevation = 1,
  sx,
  contentSx,
  headingId,
}: SectionCardProps) {
  const hasHeader = Boolean(title || action);

  return (
    <Paper
      elevation={elevation}
      aria-labelledby={headingId}
      sx={[{ overflow: "hidden" }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {hasHeader && (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            px: { xs: 2.5, sm: 3 },
            pt: { xs: 2.5, sm: 3 },
            pb: 2,
            borderBottom: (theme) =>
              title ? `1px solid ${theme.palette.divider}` : "none",
          }}
        >
          {title ? (
            <Stack
              spacing={0.5}
              sx={{ minWidth: 0, margin: !action ? "auto" : undefined }}
            >
              <Typography
                id={headingId}
                component="h2"
                variant="h6"
                fontWeight={600}
                sx={{ lineHeight: 1.3 }}
              >
                {title}
              </Typography>
              {description ? (
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              ) : null}
            </Stack>
          ) : (
            <Box sx={{ flexGrow: 1 }} />
          )}
          {action ? (
            <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
              {action}
            </Box>
          ) : null}
        </Box>
      )}
      <Box
        sx={[
          { px: { xs: 2.5, sm: 3 }, py: { xs: 2.5, sm: 3 } },
          ...(Array.isArray(contentSx) ? contentSx : [contentSx]),
        ]}
      >
        {children}
      </Box>
    </Paper>
  );
}
