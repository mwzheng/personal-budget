import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** Primary page heading shown as the h1 for the current page. */
  title: string;
  /** Optional supporting copy shown below the title. */
  description?: string;
  /** Optional action area for buttons or other controls. */
  action?: ReactNode;
  /** Optional layout overrides for page-specific spacing tweaks. */
  sx?: SxProps<Theme>;
  /** ID applied to the h1 element for aria-labelledby on the page landmark. */
  headingId?: string;
  /** ID applied to the description element for aria-describedby. */
  descriptionId?: string;
}

export default function PageHeader({
  title,
  description,
  action,
  sx,
  headingId,
  descriptionId,
}: PageHeaderProps) {
  return (
    <Stack
      component="header"
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      sx={sx}
    >
      <Box>
        <Typography id={headingId} component="h1" variant="h5" fontWeight={700}>
          {title}
        </Typography>
        {description ? (
          <Typography
            id={descriptionId}
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>

      {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
    </Stack>
  );
}
