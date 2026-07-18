import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

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
      <Stack
        direction="row"
        justifyContent="center"
        spacing={2.5}
        useFlexGap
        flexWrap="wrap"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <Box
            key={`spending-breakdown-loading-${index}`}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Skeleton variant="circular" width={12} height={12} />
            <Skeleton variant="text" width={72} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default SpendingBreakdownLoadingState;
