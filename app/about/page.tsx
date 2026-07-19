import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";

import { ABOUT_PAGE_CONTENT } from "@/lib/content/about";
import {
  APP_NAME,
  PAGE_TITLE_KEYS,
  ROUTE_PATHS,
  getPageTitleEntry,
} from "@/lib/content/page-titles";
import AboutCTA from "@/components/about/AboutCTA";
import CreatorCard from "@/components/about/CreatorCard";
import HeroSection from "@/components/about/HeroSection";
import PhilosophyCard from "@/components/about/PhilosophyCard";
import StoryGrid from "@/components/about/StoryGrid";

const ABOUT_PAGE_ENTRY = getPageTitleEntry(PAGE_TITLE_KEYS.ABOUT);

export const metadata: Metadata = {
  title: "About",
  description: ABOUT_PAGE_ENTRY.description,
  alternates: {
    canonical: ROUTE_PATHS.about,
  },
  openGraph: {
    type: "website",
    title: ABOUT_PAGE_ENTRY.title,
    description: ABOUT_PAGE_ENTRY.description,
    url: ROUTE_PATHS.about,
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary",
    title: ABOUT_PAGE_ENTRY.title,
    description: ABOUT_PAGE_ENTRY.description,
  },
};

const AboutPage = () => {
  const { creator, hero, notices, principles, sectionTitles, sections } =
    ABOUT_PAGE_CONTENT;

  return (
    <Box component="main">
      <HeroSection hero={hero} notices={notices} />
      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 8 } }}>
        <Stack spacing={{ xs: 6, md: 8 }}>
          <StoryGrid sections={sections} sectionTitle={sectionTitles.story} />
          <PhilosophyCard
            principles={principles}
            sectionTitle={sectionTitles.philosophy}
          />
          <CreatorCard creator={creator} sectionTitle={sectionTitles.creator} />
        </Stack>
      </Container>
      <AboutCTA />
    </Box>
  );
};

export default AboutPage;
