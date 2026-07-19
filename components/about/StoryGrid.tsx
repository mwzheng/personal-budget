import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ContentSection } from "@/lib/types/content";

import StorySectionCard from "./StorySectionCard";

interface StoryGridProps {
  sections: readonly ContentSection[];
  sectionTitle: string;
}

const StoryGrid = ({ sections, sectionTitle }: StoryGridProps) => (
  <Stack
    component="section"
    spacing={2.5}
    aria-labelledby="about-story-heading"
  >
    <Typography id="about-story-heading" variant="h5">
      {sectionTitle}
    </Typography>
    <Box
      sx={{
        display: "grid",
        gap: 2.5,
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(3, minmax(0, 1fr))",
        },
      }}
    >
      {sections.map((section) => (
        <StorySectionCard key={section.id} section={section} />
      ))}
    </Box>
  </Stack>
);

export default StoryGrid;
