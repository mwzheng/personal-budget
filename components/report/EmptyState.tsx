import AddIcon from "@mui/icons-material/Add";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const EmptyState = ({
  onAddClick,
  onImportClick,
}: {
  onAddClick: () => void;
  onImportClick: () => void;
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={10}
      gap={2}
    >
      <Typography variant="h5" fontWeight={600} color="text.secondary">
        No Transactions Yet
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        textAlign="center"
        maxWidth={400}
      >
        Add transactions manually or import either an expenses CSV or an income
        CSV using the supported templates.
      </Typography>
      <Stack direction="row" gap={2} mt={1}>
        <Button
          variant="outlined"
          startIcon={<FileUploadOutlinedIcon />}
          onClick={onImportClick}
        >
          Import CSV
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddClick}
        >
          Add Transaction
        </Button>
      </Stack>
    </Box>
  );
};

export default EmptyState;
