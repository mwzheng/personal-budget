import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ContactForm } from "@/components/contact/ContactForm";
import type { ContactSectionContent } from "@/lib/types/content";

interface GetInTouchSectionProps {
  content: ContactSectionContent;
}

export default function GetInTouchSection({ content }: GetInTouchSectionProps) {
  const { hero, form, sidebar, methods, topics, availabilityNote } = content;

  return (
    <Box component="section" aria-labelledby="contact-section-title">
      <Typography
        id="contact-section-title"
        variant="h4"
        fontWeight={700}
        sx={{ mb: 1.5 }}
      >
        {hero.title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {hero.summary}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: { xs: 3, lg: 4 },
          gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" },
          alignItems: "stretch",
        }}
      >
        <ContactForm form={form} />
        <Card variant="outlined" sx={{ height: "100%" }}>
          <CardContent sx={{ p: { xs: 3, md: 4 }, height: "100%" }}>
            <Stack spacing={2.5} sx={{ height: "100%" }}>
              <Typography variant="h5" fontWeight={700}>
                {sidebar.title}
              </Typography>
              <Stack spacing={1.5}>
                {methods.map((method) => (
                  <Box
                    key={method.href}
                    sx={{
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      {method.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5, mb: 1.5 }}
                    >
                      {method.description}
                    </Typography>
                    <Button
                      component="a"
                      href={method.href}
                      target="_blank"
                      rel="noreferrer"
                      variant="outlined"
                      size="small"
                    >
                      {method.cta}
                    </Button>
                  </Box>
                ))}
              </Stack>
              <Divider sx={{ borderColor: "divider" }} />
              <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {sidebar.topicsTitle}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {topics.map((topic) => (
                    <Chip
                      key={topic}
                      label={topic}
                      variant="outlined"
                      size="small"
                      sx={{
                        borderColor: "primary.dark",
                        color: "text.secondary",
                      }}
                    />
                  ))}
                </Box>
              </Stack>
              <Typography
                variant="body2"
                color="text.disabled"
                sx={{ fontStyle: "italic", mt: "auto" }}
              >
                {availabilityNote}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
