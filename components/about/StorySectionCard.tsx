import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { ContentSection } from "@/lib/types/content";

interface StorySectionCardProps {
  section: ContentSection;
}

const StorySectionCard = ({ section }: StorySectionCardProps) => {
  const headingId = `about-section-${section.id}`;

  return (
    <Paper
      component="article"
      variant="outlined"
      aria-labelledby={headingId}
      sx={{ p: { xs: 3, md: 3.5 }, height: "100%" }}
    >
      <Stack spacing={2}>
        <Typography id={headingId} component="h3" variant="h6" fontWeight={700}>
          {section.heading}
        </Typography>
        <Stack spacing={1.25}>
          {section.paragraphs.map((paragraph) => (
            <Typography
              key={`${section.id}-${paragraph}`}
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.8 }}
            >
              {paragraph}
            </Typography>
          ))}
        </Stack>
        {section.highlights?.length ? (
          <>
            <Divider flexItem />
            <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
              {section.highlights.map((highlight) => (
                <Typography
                  component="li"
                  key={`${section.id}-${highlight}`}
                  variant="body2"
                  color="text.secondary"
                >
                  {highlight}
                </Typography>
              ))}
            </Stack>
          </>
        ) : null}
      </Stack>
    </Paper>
  );
};

export default StorySectionCard;
