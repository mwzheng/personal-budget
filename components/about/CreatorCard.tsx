import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { CreatorProfile } from "@/lib/types/content";
import CreatorLink from "./CreatorLink";

interface CreatorCardProps {
  creator: CreatorProfile;
  sectionTitle: string;
}

const CreatorCard = ({ creator, sectionTitle }: CreatorCardProps) => {
  const initial = creator.name.charAt(0).toUpperCase();

  return (
    <Paper
      component="section"
      aria-labelledby="about-creator-heading"
      variant="outlined"
      sx={{ p: { xs: 3, md: 4 } }}
    >
      <Stack spacing={3}>
        <Typography id="about-creator-heading" variant="h5">
          {sectionTitle}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 3,
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" spacing={2.5} alignItems="center">
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: "primary.main",
                fontSize: "1.25rem",
                fontWeight: 700,
              }}
            >
              {initial}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {creator.name}
              </Typography>
              <Typography variant="body2" color="primary.light">
                {creator.role}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            {creator.links.map((link, i) => (
              <CreatorLink key={`${link.platform}-${i}`} link={link} />
            ))}
          </Stack>
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.8, maxWidth: 640 }}
        >
          {creator.bio[0]}
        </Typography>
      </Stack>
    </Paper>
  );
};

export default CreatorCard;
