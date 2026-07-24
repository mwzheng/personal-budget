import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import type { SocialLink } from "@/lib/types/content";

const SOCIAL_ICON_BY_PLATFORM: Record<string, React.ElementType> = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  projectGithub: GitHubIcon,
};

interface CreatorLinkProps {
  link: SocialLink;
}

const CreatorLink = ({ link }: CreatorLinkProps) => {
  const Icon = SOCIAL_ICON_BY_PLATFORM[link.platform];

  return (
    <Tooltip title={link.label}>
      <IconButton
        component="a"
        href={link.href}
        target="_blank"
        rel="noreferrer"
        sx={{
          color: "text.secondary",
          "&:hover": { color: "primary.light" },
        }}
      >
        <Icon />
      </IconButton>
    </Tooltip>
  );
};

export default CreatorLink;
