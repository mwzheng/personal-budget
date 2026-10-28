import type { Metadata } from "next";
import Image from "next/image";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BarChartIcon from "@mui/icons-material/BarChart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ContactForm } from "@/components/contact/ContactForm";
import { ABOUT_PAGE_CONTENT } from "@/lib/content/about";
import { CONTACT_SECTION_CONTENT } from "@/lib/content/contact";
import {
  APP_NAME,
  PAGE_TITLE_KEYS,
  ROUTE_PATHS,
  getPageTitleEntry,
} from "@/lib/content/page-titles";

const aboutEntry = getPageTitleEntry(PAGE_TITLE_KEYS.ABOUT);

export const metadata: Metadata = {
  title: "About",
  description: aboutEntry.description,
  alternates: { canonical: ROUTE_PATHS.about },
  openGraph: {
    type: "website",
    title: aboutEntry.title,
    description: aboutEntry.description,
    url: ROUTE_PATHS.about,
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary",
    title: aboutEntry.title,
    description: aboutEntry.description,
  },
};

const features = [
  {
    icon: ReceiptLongIcon,
    title: "Bring your transactions together",
    description:
      "Record income and expenses yourself, or import transactions from a CSV file.",
  },
  {
    icon: BarChartIcon,
    title: "See where your money goes",
    description:
      "Explore reports and compare your activity over time to understand your spending.",
  },
  {
    icon: AccountBalanceWalletOutlinedIcon,
    title: "Make a plan for the month",
    description:
      "Build a budget and compare planned amounts with your recorded transactions.",
  },
];

export default function AboutPage() {
  const { creator } = ABOUT_PAGE_CONTENT;
  const story = ABOUT_PAGE_CONTENT.sections.find(
    (section) => section.id === "origin-story",
  );
  const safetyNotice = ABOUT_PAGE_CONTENT.notices.find(
    (notice) => notice.title === "Keep It Safe",
  );

  return (
    <Box component="main">
      <Box
        component="section"
        className="dither-surface"
        sx={{
          overflow: "hidden",
          background:
            "radial-gradient(ellipse at 85% 15%, rgba(141, 201, 168, 0.16), transparent 48%)",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Container
          maxWidth="lg"
          sx={{ pt: { xs: 7, md: 11 }, pb: { xs: 7, md: 10 } }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.1fr" },
              gap: { xs: 5, md: 7 },
              alignItems: "center",
            }}
          >
            <Stack spacing={3} alignItems="flex-start">
              <Typography
                variant="overline"
                color="primary.main"
                fontWeight={700}
                sx={{ letterSpacing: "0.14em" }}
              >
                About {APP_NAME}
              </Typography>
              <Typography
                component="h1"
                variant="h1"
                sx={{
                  fontSize: { xs: "2.8rem", md: "4.3rem" },
                  lineHeight: 1.06,
                  letterSpacing: "-0.045em",
                }}
              >
                Make room for a better plan.
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 490, fontSize: "1.1rem", lineHeight: 1.8 }}
              >
                {APP_NAME} brings your spending, budget, and long-term plans
                together so you can see where your money goes and decide what
                comes next.
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Button
                  variant="contained"
                  size="large"
                  href={ROUTE_PATHS.login}
                  endIcon={<ArrowForwardIcon />}
                >
                  Try the demo
                </Button>
                <Button variant="text" size="large" href="#support">
                  Contact support
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Choose Continue with Demo on the sign-in page.
              </Typography>
            </Stack>
            <Box sx={{ minWidth: 0 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 1, sm: 1.5 },
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.16)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1,
                    pb: 1.5,
                    pt: 0.5,
                  }}
                  aria-hidden="true"
                >
                  {[0, 1, 2].map((dot) => (
                    <Box
                      key={dot}
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        bgcolor: "text.disabled",
                        opacity: 0.5,
                      }}
                    />
                  ))}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    Reports
                  </Typography>
                </Box>
                <Box
                  sx={{
                    borderRadius: 1.5,
                    overflow: "hidden",
                    lineHeight: 0,
                    aspectRatio: "4 / 3",
                  }}
                >
                  <Image
                    src="/images/about-reports.png"
                    alt="Reports page showing example transactions and spending charts"
                    width={1440}
                    height={1708}
                    sizes="(max-width: 900px) 100vw, 600px"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "top",
                    }}
                  />
                </Box>
              </Paper>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1.5, textAlign: "right" }}
              >
                A look inside the reports workspace, with example data.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Stack spacing={{ xs: 9, md: 14 }}>
          <Box
            component="section"
            aria-labelledby="features-heading"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "0.8fr 1.2fr" },
              gap: { xs: 4, md: 10 },
            }}
          >
            <Box>
              <Typography
                variant="overline"
                color="primary.main"
                fontWeight={700}
              >
                How it works
              </Typography>
              <Typography
                id="features-heading"
                component="h2"
                variant="h3"
                sx={{ mt: 1, fontWeight: 700, letterSpacing: "-0.035em" }}
              >
                A little more clarity, one step at a time.
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 2, lineHeight: 1.8 }}
              >
                Start with the everyday details. Use them to understand your
                habits and plan ahead.
              </Typography>
            </Box>
            <Stack divider={<Divider flexItem />}>
              {features.map(({ icon: Icon, title, description }) => (
                <Box
                  key={title}
                  sx={{
                    display: "flex",
                    gap: 2.5,
                    py: 3,
                    "&:first-of-type": { pt: 0 },
                  }}
                >
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "action.hover",
                      color: "primary.main",
                    }}
                  >
                    <Icon aria-hidden="true" />
                  </Box>
                  <Box>
                    <Typography component="h3" variant="h6" fontWeight={700}>
                      {title}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{ mt: 0.75, lineHeight: 1.7 }}
                    >
                      {description}
                    </Typography>
                  </Box>
                </Box>
              ))}
              <Box sx={{ pt: 3 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Looking further ahead?
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mt: 0.75, lineHeight: 1.7 }}
                >
                  Track retirement savings and salary history, and explore
                  financial independence scenarios with the FIRE calculator.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Paper
            component="section"
            aria-labelledby="story-heading"
            variant="outlined"
            sx={{
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "0.8fr 1.2fr" },
              borderRadius: 3,
            }}
          >
            <Box
              sx={{
                p: { xs: 3, md: 5 },
                bgcolor: "action.hover",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 4,
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  color="primary.main"
                  fontWeight={700}
                >
                  The story
                </Typography>
                <Typography
                  id="story-heading"
                  component="h2"
                  variant="h3"
                  sx={{ mt: 1, fontWeight: 700, letterSpacing: "-0.035em" }}
                >
                  A personal project, made to be useful.
                </Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Free to use. Built and maintained by Mickey.
              </Typography>
            </Box>
            <Stack spacing={2} sx={{ p: { xs: 3, md: 5 } }}>
              {story?.paragraphs.map((paragraph) => (
                <Typography
                  key={paragraph}
                  color="text.secondary"
                  sx={{ lineHeight: 1.8 }}
                >
                  {paragraph}
                </Typography>
              ))}
              <Divider sx={{ my: 1 }} />
              <Typography component="h3" variant="h6" fontWeight={700}>
                Meet {creator.name}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {creator.bio[0]} {APP_NAME} is a free personal project that I
                continue to improve.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {creator.links.map((link) => (
                  <Button
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    size="small"
                  >
                    {link.label}
                  </Button>
                ))}
              </Stack>
            </Stack>
          </Paper>

          <Box
            component="section"
            aria-labelledby="data-heading"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "0.8fr 1.2fr" },
              gap: { xs: 2, md: 10 },
            }}
          >
            <Box>
              <Typography
                variant="overline"
                color="primary.main"
                fontWeight={700}
              >
                Your data
              </Typography>
              <Typography
                id="data-heading"
                component="h2"
                variant="h4"
                fontWeight={700}
                sx={{ mt: 1 }}
              >
                You choose what to enter.
              </Typography>
            </Box>
            <Stack spacing={2}>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Your transactions come from manual entry or CSV import.{" "}
                {APP_NAME} does not connect to your bank.
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {safetyNotice?.body}
              </Typography>
            </Stack>
          </Box>

          <Box
            component="section"
            id="support"
            aria-labelledby="support-heading"
            sx={{
              scrollMarginTop: 32,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "0.8fr 1.2fr" },
              gap: { xs: 3, md: 10 },
              alignItems: "start",
            }}
          >
            <Box>
              <Typography
                variant="overline"
                color="primary.main"
                fontWeight={700}
              >
                Get in touch
              </Typography>
              <Typography
                id="support-heading"
                component="h2"
                variant="h3"
                sx={{ mt: 1, fontWeight: 700, letterSpacing: "-0.035em" }}
              >
                Questions or need help?
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 2, lineHeight: 1.8 }}
              >
                Send me a question, report a problem, or share an idea for the
                app.
              </Typography>
              <Typography
                color="text.secondary"
                variant="body2"
                sx={{ mt: 2, lineHeight: 1.8 }}
              >
                {CONTACT_SECTION_CONTENT.availabilityNote}
              </Typography>
            </Box>
            <ContactForm form={CONTACT_SECTION_CONTENT.form} />
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
