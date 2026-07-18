import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
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
    <Card>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {loading ? (
          <Skeleton width={90} height={32} />
        ) : (
          <>
            <Typography variant="h6" fontWeight={700} sx={{ color }}>
              {value}
            </Typography>
            {trend ? (
              <Box
                sx={{
                  mt: 0.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  minHeight: 18,
                }}
              >
                {trend.direction === "up" ? (
                  <ArrowUpwardIcon sx={{ fontSize: 14, color: trend.color }} />
                ) : trend.direction === "down" ? (
                  <ArrowDownwardIcon
                    sx={{ fontSize: 14, color: trend.color }}
                  />
                ) : null}
                <Typography
                  variant="caption"
                  sx={{ color: trend.color, lineHeight: 1.35 }}
                >
                  {trend.text}
                </Typography>
              </Box>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
