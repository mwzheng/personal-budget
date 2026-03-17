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
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ContactForm } from "@/components/contact/ContactForm";
import { CONTACT_PAGE_CONTENT } from "@/lib/content/contact";
import { PAGE_TITLE_KEYS, PAGE_TITLES } from "@/lib/content/page-titles";
import type { ContentNotice } from "@/lib/types/content";

const contactPageTitle = PAGE_TITLES[PAGE_TITLE_KEYS.CONTACT];

export const metadata: Metadata = {
  title: contactPageTitle.title,
  description: contactPageTitle.description,
};

function ContactNoticeCard({ notice }: { notice: ContentNotice }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3, height: "100%" }}>
        <Stack spacing={1}>
          <Chip
            label={notice.title}
            color="primary"
            variant="outlined"
            sx={{ alignSelf: "flex-start", fontWeight: 600 }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.7 }}
          >
            {notice.body}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ContactPage() {
  const {
    availabilityNote,
    form,
    hero,
    methods,
    notices,
    sidebar,
    summary,
    topics,
  } = CONTACT_PAGE_CONTENT;

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
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
            }}
          >
            {notices.map((notice) => (
              <ContactNoticeCard key={notice.title} notice={notice} />
            ))}
          </Box>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, lg: 4 },
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
            },
            alignItems: "stretch",
          }}
        >
          <ContactForm form={form} />

          <Stack spacing={3} sx={{ height: "100%" }}>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent sx={{ p: 3, height: "100%" }}>
                <Stack spacing={2}>
                  <Typography variant="h5" fontWeight={700}>
                    {sidebar.methodsTitle}
                  </Typography>
                  <Typography color="text.secondary">
                    {sidebar.methodsDescription}
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
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ minWidth: 0 }}
                      >
                        {method.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                          minWidth: 0,
                        }}
                      >
                        {method.description}
                      </Typography>
                      <Button
                        component="a"
                        href={method.href}
                        target="_blank"
                        rel="noreferrer"
                        variant="outlined"
                        endIcon={<LaunchIcon />}
                        sx={{ alignSelf: "flex-start", whiteSpace: "normal" }}
                      >
                        {method.cta}
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent sx={{ p: 3, height: "100%" }}>
                <Stack spacing={2} sx={{ height: "100%" }}>
                  <Typography variant="h5" fontWeight={700}>
                    {sidebar.topicsTitle}
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
                  <Box sx={{ mt: "auto" }}>
                    <Typography variant="body2" color="text.secondary">
                      {availabilityNote}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
