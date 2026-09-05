"use client";

import { useState } from "react";
import { useColorScheme } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContrastRoundedIcon from "@mui/icons-material/ContrastRounded";
import type { AppearanceMode } from "@/lib/theme/appearance-storage";

export function AppearanceMenu({ mobile = false }: { mobile?: boolean }) {
  const { mode, setMode } = useColorScheme();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = mobile ? "mobile-appearance" : "desktop-appearance";
  return (
    <>
      <Button
        id={`${id}-button`}
        color="inherit"
        startIcon={<ContrastRoundedIcon />}
        aria-haspopup="menu"
        aria-controls={anchor ? id : undefined}
        aria-expanded={Boolean(anchor)}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{
          color: "text.secondary",
          minHeight: 44,
          ...(mobile
            ? { width: "100%", justifyContent: "flex-start", my: 1 }
            : {}),
        }}
      >
        Appearance
      </Button>
      <Menu
        id={id}
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        MenuListProps={{ "aria-labelledby": `${id}-button` }}
      >
        {(["light", "dark", "system"] as AppearanceMode[]).map((option) => (
          <MenuItem
            key={option}
            role="menuitemradio"
            aria-checked={(mode ?? "system") === option}
            selected={(mode ?? "system") === option}
            onClick={() => {
              setMode(option);
              setAnchor(null);
            }}
          >
            <ListItemIcon>
              {(mode ?? "system") === option ? (
                <CheckRoundedIcon fontSize="small" />
              ) : null}
            </ListItemIcon>
            {option[0].toUpperCase() + option.slice(1)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
