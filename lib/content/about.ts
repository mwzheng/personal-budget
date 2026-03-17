/**
 * Note 1: This module keeps the about-page story in plain data so the eventual
 * page can stay presentation-only and reuse the same source in cards, metadata,
 * and tests.
 */

import type {
  AboutPageContent,
  CreatorProfile,
  SocialLink,
  SocialPlatform,
} from "../types/content";
import { APP_NAME } from "./page-titles";

export const CREATOR_SOCIAL_LINKS = {
  github: {
    platform: "github",
    label: "GitHub",
    href: "https://github.com/mwzheng",
    handle: "mwzheng",
    external: true,
    description: "Follow the code and public build history.",
  },
  linkedin: {
    platform: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/mwzheng/",
    handle: "mwzheng",
    external: true,
    description: "Connect with me in a professional context.",
  },
} as const satisfies Record<SocialPlatform, SocialLink>;

export const CREATOR_SOCIAL_LINK_LIST = [
  CREATOR_SOCIAL_LINKS.github,
  CREATOR_SOCIAL_LINKS.linkedin,
] as const satisfies readonly SocialLink[];

export const CREATOR_PROFILE = {
  name: "Mickey",
  role: "Software Engineer",
  experienceSummary:
    "4+ years of experience and currently working full time as a software engineer.",
  bio: [
    "Mickey is a software engineer with 4+ years of experience and currently works full time as a software engineer.",
    `${APP_NAME} is a hobby project that turns a manual Excel and Notion budgeting habit into one focused app.`,
  ],
  links: CREATOR_SOCIAL_LINK_LIST,
} satisfies CreatorProfile;

// Note 2: These principles are intentionally short because they are likely to
// be reused in hero cards, a future footer blurb, or lightweight marketing UI.
export const APP_PHILOSOPHY_PRINCIPLES = [
  "Keep the budgeting loop close enough that each entry still feels intentional.",
  "Combine the best parts of manual Excel and Notion tracking in one calmer workflow.",
  "Favor clarity and reflection over maximum automation.",
] as const;

export const ABOUT_PAGE_CONTENT = {
  hero: {
    eyebrow: "About",
    title: `Why ${APP_NAME} exists`,
    summary: `I built ${APP_NAME} to bring my manual Excel and Notion budgeting workflow into one focused app.`,
  },
  creator: CREATOR_PROFILE,
  summary: [
    `I started ${APP_NAME} as a side project to reduce the friction of managing money across an Excel sheet and a Notion setup.`,
    "I was not trying to build the loudest finance dashboard. I wanted one place that still feels deliberate, understandable, and worth opening regularly.",
  ],
  facts: [
    {
      label: "Creator",
      value: CREATOR_PROFILE.name,
    },
    {
      label: "Role",
      value: CREATOR_PROFILE.role,
    },
    {
      label: "Experience",
      value: "4+ years",
    },
    {
      label: "Project type",
      value: "Hobby project",
    },
  ],
  principles: APP_PHILOSOPHY_PRINCIPLES,
  sections: [
    {
      id: "origin-story",
      heading: "Origin story",
      paragraphs: [
        "Before this app existed, I was already tracking money manually in Excel and Notion.",
        "That setup worked, but it split the same habit across multiple tools. I built Porridge Budget to keep that workflow in one place without pretending the manual parts were a mistake.",
      ],
    },
    {
      id: "manual-entry",
      heading: "Mindful manual entry",
      paragraphs: [
        "Many budgeting tools optimize for bank aggregation first. I take a different stance: manual entry is useful because it creates a short pause and keeps spending decisions visible.",
        "That is why the product language centers on mindful entry, review, and reflection instead of passive syncing.",
      ],
      highlights: [
        "Manual entry is a feature, not a fallback.",
        "One app should replace tab switching, not awareness.",
      ],
    },
    {
      id: "product-direction",
      heading: "Product direction",
      paragraphs: [
        "I want the app to feel like a personal tool, not a financial firehose. Reports, goals, and progress views should support deliberate planning rather than endless configuration.",
        "If a future feature makes the workflow faster, it still needs to preserve the sense of ownership that came from my original Excel and Notion habit.",
      ],
    },
  ],
} satisfies AboutPageContent;
