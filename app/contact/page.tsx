/**
 * Note 1: This page stays server-rendered so the shared content blocks and SEO
 * metadata ship in the first HTML response, while only the form itself hydrates.
 */

import type { Metadata } from "next";
import LaunchIcon from "@mui/icons-material/Launch";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ContactForm } from "@/components/contact/ContactForm";
import { CONTACT_PAGE_CONTENT } from "@/lib/content/contact";
import { PAGE_TITLE_KEYS, PAGE_TITLES } from "@/lib/content/page-titles";

const contactPageTitle = PAGE_TITLES[PAGE_TITLE_KEYS.CONTACT];

export const metadata: Metadata = {
  title: contactPageTitle.title,
  description: contactPageTitle.description,
};

export default function ContactPage() {
  const { availabilityNote, form, hero, methods, summary, topics } =
    CONTACT_PAGE_CONTENT;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
      <Stack spacing={{ xs: 4, md: 6 }}>
        <Stack spacing={2} sx={{ maxWidth: 760 }}>
          <Typography
            variant="overline"
            color="primary.main"
            sx={{ letterSpacing: 1.2 }}
          >
            {hero.eyebrow}
          </Typography>
          <Typography component="h1" variant="h3" fontWeight={700}>
            {hero.title}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {hero.summary}
          </Typography>
          {summary.map((paragraph) => (
            <Typography key={paragraph} variant="body1" color="text.secondary">
              {paragraph}
            </Typography>
          ))}
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, lg: 4 },
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
            },
            alignItems: "start",
          }}
        >
          <ContactForm form={form} />

          <Stack spacing={3}>
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h5" fontWeight={700}>
                    Other ways to connect
                  </Typography>
                  <Typography color="text.secondary">
                    If a public thread or professional introduction makes more
                    sense, these channels stay available too.
                  </Typography>

                  {methods.map((method) => (
                    <Stack
                      key={method.href}
                      spacing={1.25}
                      sx={{
                        p: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="h6" fontWeight={600}>
                        {method.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {method.description}
                      </Typography>
                      <Button
                        component="a"
                        href={method.href}
                        target="_blank"
                        rel="noreferrer"
                        variant="outlined"
                        endIcon={<LaunchIcon />}
                        sx={{ alignSelf: "flex-start" }}
                      >
                        {method.cta}
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h5" fontWeight={700}>
                    Good reasons to reach out
                  </Typography>
                  <Stack component="ul" spacing={1.25} sx={{ m: 0, pl: 2.5 }}>
                    {topics.map((topic) => (
                      <Typography
                        component="li"
                        key={topic}
                        variant="body2"
                        color="text.secondary"
                      >
                        {topic}
                      </Typography>
                    ))}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {availabilityNote}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
