import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

export interface StatCardProps {
  label: string;
  value: string;
  color: string;
  loading: boolean;
  foot?: string;
}

const StatCard = ({ label, value, color, loading, foot }: StatCardProps) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: { xs: 1.5, sm: 2 },
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        borderRadius: 2.5,
        boxShadow: "0 12px 30px rgba(35, 43, 39, 0.045)",
        gap: 0.5,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ lineHeight: 1.2, textAlign: "left" }}
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
            sx={{
              color,
              lineHeight: 1.2,
              overflowWrap: "anywhere",
              textAlign: "left",
            }}
          >
            {value}
          </Typography>
          {foot && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ lineHeight: 1.2, textAlign: "left" }}
            >
              {foot}
            </Typography>
          )}
        </>
      )}
    </Paper>
  );
};

export default StatCard;
