import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import HeaderInfo from "./HeaderInfo";

export interface PageHeaderProps {
  /** Primary page heading shown as the h1 for the current page. */
  title: string;
  /** Optional supporting copy shown in an info tooltip. */
  description?: string;
  /** Optional action area for buttons or other controls. */
  action?: ReactNode;
  /** Optional layout overrides for page-specific spacing tweaks. */
  sx?: SxProps<Theme>;
  /** ID applied to the h1 element for aria-labelledby on the page landmark. */
  headingId?: string;
  /** ID applied to the description element for aria-describedby. */
  descriptionId?: string;
  /** Optional decorative dither treatment for the header surface. */
  texture?: "none" | "blue" | "violet";
}

export default function PageHeader({
  title,
  description,
  action,
  sx,
  headingId,
  descriptionId,
  texture = "none",
}: PageHeaderProps) {
  return (
    <Stack
      component="header"
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      className={
        texture === "blue"
          ? "dither-surface"
          : texture === "violet"
            ? "dither-violet"
            : undefined
      }
      sx={[
        {
          p: texture === "none" ? 0 : 2,
          border: texture === "none" ? 0 : 1,
          borderColor: "divider",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography id={headingId} component="h1" variant="h5" fontWeight={700}>
          {title}
        </Typography>
        {description ? (
          <HeaderInfo title={title} description={description} />
        ) : null}
        {description && descriptionId ? (
          <Box
            id={descriptionId}
            sx={{
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
            }}
          >
            {description}
          </Box>
        ) : null}
      </Box>

      {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
    </Stack>
  );
}
