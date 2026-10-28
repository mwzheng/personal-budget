import Box from "@mui/material/Box";

/** Decorative mark; the adjacent text or link supplies its accessible name. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 100 100"
      aria-hidden="true"
      sx={{ width: size, height: size, flexShrink: 0, color: "primary.main" }}
    >
      <path
        d="M18 45h64c-2 21-14 32-32 32S20 66 18 45Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path
        d="M30 37l12-10 10 6 17-14M59 19h10v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}
