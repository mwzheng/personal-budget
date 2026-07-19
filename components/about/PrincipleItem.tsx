import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

const PRIMARY = SERVER_THEME_TOKENS.palette.primary;

interface PrincipleItemProps {
  principle: string;
  index: number;
}

const PrincipleItem = ({ principle, index }: PrincipleItemProps) => (
  <Box
    sx={{
      display: "flex",
      gap: 2,
      p: 2,
      borderRadius: 1,
      border: `1px solid ${alpha(PRIMARY, 0.2)}`,
      bgcolor: alpha(PRIMARY, 0.04),
    }}
  >
    <Typography
      variant="caption"
      sx={{
        color: "primary.light",
        fontWeight: 700,
        fontSize: "0.75rem",
        lineHeight: 1.7,
        flexShrink: 0,
        minWidth: 20,
      }}
    >
      {String(index + 1).padStart(2, "0")}
    </Typography>
    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
      {principle}
    </Typography>
  </Box>
);

export default PrincipleItem;
