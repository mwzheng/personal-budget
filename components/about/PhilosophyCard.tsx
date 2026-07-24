import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import PrincipleItem from "./PrincipleItem";

interface PhilosophyCardProps {
  principles: readonly string[];
  sectionTitle: string;
}

const PhilosophyCard = ({ principles, sectionTitle }: PhilosophyCardProps) => (
  <Stack
    component="section"
    spacing={2.5}
    aria-labelledby="about-philosophy-heading"
  >
    <Typography id="about-philosophy-heading" variant="h5">
      {sectionTitle}
    </Typography>
    <Stack component="ul" spacing={1.25} sx={{ listStyle: "none", m: 0, p: 0 }}>
      {principles.map((principle, index) => (
        <Box component="li" key={principle}>
          <PrincipleItem principle={principle} index={index} />
        </Box>
      ))}
    </Stack>
  </Stack>
);

export default PhilosophyCard;
