"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

export default function HeaderInfo({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Tooltip title={description} describeChild>
      <IconButton
        size="small"
        aria-label={`About ${title}`}
        sx={{ color: "text.secondary" }}
      >
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
