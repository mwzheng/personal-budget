/**
 * Note 1: This page stays presentation-focused by consuming `FAQ_PAGE_CONTENT`
 * directly, which keeps route copy reusable for navigation, metadata, and any
 * future search or filtering UI.
 */

import type { Metadata } from "next";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { FAQ_PAGE_CONTENT } from "@/lib/content/faq";
import { PAGE_TITLE_KEYS, getPageTitleEntry } from "@/lib/content/page-titles";

const FAQ_PAGE_ENTRY = getPageTitleEntry(PAGE_TITLE_KEYS.FAQ);
// Note 1.1: These style constants keep the Server Component serializable. MUI
// client components can receive plain `sx` objects from the server, but not
// theme callback functions, so the current dark-theme colors are flattened here.
const FAQ_PRIMARY = "#2D7DD2";
const FAQ_PAPER = "#242424";
const FAQ_BORDER = alpha("#ffffff", 0.08);
const FAQ_CATEGORY_BORDER = alpha(FAQ_PRIMARY, 0.35);
const FAQ_HERO_BORDER = alpha(FAQ_PRIMARY, 0.26);
const FAQ_HERO_BACKGROUND = `linear-gradient(160deg, ${alpha(
  FAQ_PRIMARY,
  0.2,
)} 0%, ${alpha(FAQ_PAPER, 0.98)} 32%, ${FAQ_PAPER} 100%)`;
const FAQ_HERO_SHADOW = `0 24px 48px ${alpha("#000000", 0.24)}`;
const FAQ_ACCORDION_BACKGROUND = alpha(FAQ_PAPER, 0.94);

export const metadata: Metadata = {
  title: "FAQ",
  description: FAQ_PAGE_ENTRY.description,
};

function formatFaqCategoryLabel(category: string) {
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function FaqPage() {
  const { hero, items } = FAQ_PAGE_CONTENT;
  const categories = Array.from(new Set(items.map((item) => item.category)));

  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 6, md: 8 } }}>
      <Stack spacing={{ xs: 4, md: 5 }}>
        <Paper
          component="section"
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: FAQ_HERO_BORDER,
            background: FAQ_HERO_BACKGROUND,
            boxShadow: FAQ_HERO_SHADOW,
          }}
        >
          <Stack spacing={2.5}>
            {hero.eyebrow ? (
              <Chip
                label={hero.eyebrow}
                color="primary"
                size="small"
                sx={{ alignSelf: "flex-start", fontWeight: 700 }}
              />
            ) : null}

            <Box>
              <Typography
                component="h1"
                variant="h2"
                sx={{
                  fontSize: { xs: "2.4rem", md: "3.4rem" },
                  fontWeight: 700,
                  lineHeight: 1.1,
                }}
              >
                {hero.title}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 2, maxWidth: 700, lineHeight: 1.75 }}
              >
                {hero.summary}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip
                label={`${items.length} questions`}
                variant="outlined"
                sx={{ borderColor: alpha("#ffffff", 0.18) }}
              />
              <Chip
                label={`${categories.length} topics`}
                variant="outlined"
                sx={{ borderColor: alpha("#ffffff", 0.18) }}
              />
            </Stack>
          </Stack>
        </Paper>

        <Stack
          component="section"
          spacing={2.5}
          aria-labelledby="faq-list-heading"
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ maxWidth: 640 }}>
              <Typography id="faq-list-heading" component="h2" variant="h4">
                Frequently asked questions
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 1.25, lineHeight: 1.75 }}
              >
                Browse the most common questions about the app, the workflow,
                and why the product intentionally favors mindful budgeting over
                passive syncing.
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{ alignContent: "flex-start" }}
            >
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={formatFaqCategoryLabel(category)}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: FAQ_CATEGORY_BORDER,
                    color: "text.secondary",
                  }}
                />
              ))}
            </Stack>
          </Box>

          <Box>
            {items.map((item, index) => {
              const panelId = `faq-panel-${item.id}`;

              return (
                <Accordion
                  key={item.id}
                  defaultExpanded={index === 0}
                  disableGutters
                  sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: FAQ_BORDER,
                    backgroundColor: FAQ_ACCORDION_BACKGROUND,
                    backgroundImage: "none",
                    boxShadow: "none",
                    "&:before": { display: "none" },
                    "&:not(:first-of-type)": { mt: 1.5 },
                  }}
                >
                  {/* Note 2: Opening the first panel by default gives first-time
                      visitors an immediate content sample without forcing them to
                      discover the accordion affordance on a dark surface first. */}
                  <AccordionSummary
                    expandIcon={<ExpandMoreRoundedIcon color="primary" />}
                    aria-controls={`${panelId}-content`}
                    id={`${panelId}-header`}
                    sx={{
                      px: { xs: 2.5, md: 3 },
                      py: 0.75,
                      "& .MuiAccordionSummary-content": { my: 1.25 },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        textAlign: "left",
                      }}
                    >
                      <Typography
                        component="span"
                        variant="overline"
                        color="primary.light"
                        sx={{ letterSpacing: 1.3 }}
                      >
                        {formatFaqCategoryLabel(item.category)}
                      </Typography>
                      <Typography
                        component="span"
                        variant="h6"
                        sx={{ fontWeight: 600, lineHeight: 1.35 }}
                      >
                        {item.question}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails
                    id={`${panelId}-content`}
                    sx={{
                      px: { xs: 2.5, md: 3 },
                      pb: { xs: 2.5, md: 3 },
                      pt: 0,
                    }}
                  >
                    <Typography
                      component="p"
                      variant="body1"
                      color="text.secondary"
                      sx={{ lineHeight: 1.8 }}
                    >
                      {item.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        </Stack>
      </Stack>
    </Container>
  );
}
