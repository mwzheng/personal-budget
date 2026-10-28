import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

const SpendingBreakdownLoadingState = () => {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Box
        sx={{
          width: "100%",
          minHeight: 340,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Skeleton
          variant="circular"
          animation="wave"
          width={220}
          height={220}
        />
      </Box>
    </Box>
  );
};

export default SpendingBreakdownLoadingState;
