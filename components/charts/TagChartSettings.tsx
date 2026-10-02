"use client";

import { useMemo, useState } from "react";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

interface Props {
  availableTags: string[];
  excludedTags: string[];
  onChange: (excludedTags: string[]) => void;
  onOpen?: () => void;
  loadingTags?: boolean;
}

export function TagChartSettings({
  availableTags,
  excludedTags,
  onChange,
  onOpen,
  loadingTags = false,
}: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");
  const isOpen = Boolean(anchor);
  const tags = useMemo(
    () =>
      [...new Set([...availableTags, ...excludedTags])].sort((a, b) =>
        a.localeCompare(b),
      ),
    [availableTags, excludedTags],
  );
  const visibleTags = tags.filter((tag) =>
    tag.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const excluded = new Set(excludedTags);

  const toggleTag = (tag: string) => {
    onChange(
      excluded.has(tag)
        ? excludedTags.filter((excludedTag) => excludedTag !== tag)
        : [...excludedTags, tag],
    );
  };

  return (
    <>
      <Tooltip title="Top Tags settings">
        <IconButton
          size="small"
          aria-label="Top Tags settings"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={(event) => {
            setAnchor(event.currentTarget);
            onOpen?.();
          }}
        >
          <SettingsOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={isOpen}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { width: 320, maxWidth: "calc(100vw - 32px)", p: 2 },
          },
        }}
        role="dialog"
        aria-label="Top Tags settings"
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
          <Typography component="h3" variant="subtitle1" fontWeight={600}>
            Excluded tags
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            disabled={excludedTags.length === 0}
            onClick={() => onChange([])}
          >
            Clear all
          </Button>
        </Box>
        <TextField
          size="small"
          fullWidth
          label="Search tags"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ mb: 1 }}
        />
        {loadingTags ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 0.5 }}
          >
            Loading account tags...
          </Typography>
        ) : null}
        <Box
          sx={{ maxHeight: 280, overflowY: "auto", display: "grid", gap: 0.25 }}
        >
          {visibleTags.length > 0 ? (
            visibleTags.map((tag) => (
              <FormControlLabel
                key={tag}
                sx={{ m: 0, minHeight: 36, alignItems: "center" }}
                control={
                  <Checkbox
                    size="small"
                    checked={excluded.has(tag)}
                    onChange={() => toggleTag(tag)}
                    inputProps={{
                      "aria-label": `Exclude ${tag} from Top Tags`,
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                    {tag}
                  </Typography>
                }
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              {tags.length === 0 ? "No tags available" : "No matching tags"}
            </Typography>
          )}
        </Box>
      </Popover>
    </>
  );
}
