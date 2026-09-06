import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import type { ContentNotice } from "@/lib/types/content";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

const PRIMARY = SERVER_THEME_TOKENS.palette.primary;
const NOTICE_BORDER = `color-mix(in srgb, ${PRIMARY} 16.0%, transparent)`;
const NOTICE_BG = `color-mix(in srgb, ${PRIMARY} 4.0%, transparent)`;

const NOTICE_ICONS: React.ElementType[] = [
  CheckCircleOutlineIcon,
  LockOutlinedIcon,
];

interface NoticeBannerProps {
  notices: readonly ContentNotice[];
}

const NoticeBanner = ({ notices }: NoticeBannerProps) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      borderColor: NOTICE_BORDER,
      bgcolor: NOTICE_BG,
    }}
  >
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap>
      {notices.map((notice, index) => {
        const Icon = NOTICE_ICONS[index] ?? CheckCircleOutlineIcon;
        return (
          <Stack
            key={notice.title}
            direction="row"
            spacing={1.5}
            alignItems="flex-start"
            sx={{ flex: 1 }}
          >
            <Icon
              aria-hidden="true"
              sx={{ fontSize: 20, mt: 0.3, color: "primary.light" }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.25 }}>
                {notice.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {notice.body}
              </Typography>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  </Paper>
);

export default NoticeBanner;
