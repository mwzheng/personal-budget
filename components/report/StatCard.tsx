import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

export interface StatCardProps {
  label: string;
  value: string;
  color: string;
  loading: boolean;
  trend?: {
    direction: "up" | "down" | null;
    text: string;
    color: string;
  } | null;
}

const StatCard = ({ label, value, color, loading, trend }: StatCardProps) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: { xs: 1.5, sm: 2 },
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ lineHeight: 1.2 }}
      >
        {label}
      </Typography>
      {loading ? (
        <Skeleton width={80} height={28} />
      ) : (
        <>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ color, lineHeight: 1.2 }}
          >
            {value}
          </Typography>
          {trend && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                minHeight: 16,
              }}
            >
              {trend.direction === "up" ? (
                <ArrowUpwardIcon sx={{ fontSize: 12, color: trend.color }} />
              ) : trend.direction === "down" ? (
                <ArrowDownwardIcon sx={{ fontSize: 12, color: trend.color }} />
              ) : null}
              <Typography
                variant="caption"
                sx={{
                  color: trend.color,
                  lineHeight: 1.2,
                  fontSize: "0.6875rem",
                }}
              >
                {trend.text}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default StatCard;
