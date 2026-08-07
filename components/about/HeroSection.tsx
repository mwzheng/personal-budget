import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { ContentHero, ContentNotice } from "@/lib/types/content";

interface HeroSectionProps {
  hero: ContentHero;
  notices: readonly ContentNotice[];
}

const HeroSection = ({ hero, notices }: HeroSectionProps) => (
  <Box
    component="section"
    aria-labelledby="about-hero-title"
    sx={{
      position: "relative",
      overflow: "hidden",
      py: 10,
      "&::before": {
        content: '""',
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(circle at 50% -20%, rgba(54, 217, 197, 0.14) 0%, transparent 50%), radial-gradient(circle at 50% 10%, rgba(85, 199, 232, 0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      },
    }}
  >
    <Container maxWidth="md">
      <Stack spacing={4} alignItems="center" textAlign="center">
        <Typography
          id="about-hero-title"
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: "2.75rem", sm: "3.5rem", md: "4.5rem" },
            letterSpacing: "-0.05em",
            color: "text.primary",
          }}
        >
          {hero.title}
        </Typography>
        <Typography
          variant="h5"
          component="p"
          color="text.secondary"
          sx={{
            maxWidth: 600,
            lineHeight: 1.7,
            fontSize: { xs: "1rem", md: "1.25rem" },
            fontWeight: 400,
          }}
        >
          {hero.summary}
        </Typography>
        {notices.length > 0 ? (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            justifyContent="center"
          >
            {notices.map((notice) => (
              <Chip
                key={notice.title}
                label={notice.title}
                variant="outlined"
                size="small"
                sx={{
                  borderColor: "primary.dark",
                  color: "text.secondary",
                  fontWeight: 500,
                }}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Container>
  </Box>
);

export default HeroSection;
