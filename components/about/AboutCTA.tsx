import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ROUTE_PATHS } from "@/lib/content/page-titles";

const AboutCTA = () => (
  <Box sx={{ textAlign: "center", py: { xs: 6, md: 8 } }}>
    <Container maxWidth="sm">
      <Stack spacing={3} alignItems="center">
        <Typography variant="h4" fontWeight={700}>
          Ready to take control of your budget?
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 480, lineHeight: 1.7 }}
        >
          Start tracking your spending with intention. No bank sync, no
          clutter&mdash;just clarity.
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" size="large" href={ROUTE_PATHS.register}>
            Get Started
          </Button>
          <Button variant="outlined" size="large" href={ROUTE_PATHS.home}>
            Learn More
          </Button>
        </Stack>
      </Stack>
    </Container>
  </Box>
);

export default AboutCTA;
