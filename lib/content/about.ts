import type {
  AboutPageContent,
  CreatorProfile,
  SocialLink,
  SocialPlatform,
} from "../types/content";
import { APP_NAME } from "./page-titles";

export const CREATOR_SOCIAL_LINKS = {
  linkedin: {
    platform: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/mwzheng/",
    handle: "mwzheng",
    external: true,
    description: "Connect with me in a professional context.",
  },
  github: {
    platform: "github",
    label: "My GitHub",
    href: "https://github.com/mwzheng",
    handle: "mwzheng",
    external: true,
    description: "Visit my GitHub profile.",
  },
  projectGithub: {
    platform: "github",
    label: "Project GitHub",
    href: "https://github.com/mwzheng/personal-budget",
    handle: "mwzheng/personal-budget",
    external: true,
    description: "Visit the GitHub repository for this project.",
  },
} as const satisfies Record<SocialPlatform, SocialLink>;

export const CREATOR_SOCIAL_LINK_LIST = [
  CREATOR_SOCIAL_LINKS.linkedin,
  CREATOR_SOCIAL_LINKS.github,
  CREATOR_SOCIAL_LINKS.projectGithub,
] as const satisfies readonly SocialLink[];

export const CREATOR_PROFILE = {
  name: "Mickey",
  role: "Full Stack Software Engineer",
  experienceSummary:
    "5+ years of experience, currently working full time, and passionate about building tools that help people budget smarter.",
  bio: [
    "I'm a full stack software engineer who likes building practical tools around real workflows.",

    `${APP_NAME} started as a hobby project to simplify my budgeting process. I was managing everything across spreadsheets and notes, and wanted something that kept the intentionality without the context switching.`,
  ],
  links: CREATOR_SOCIAL_LINK_LIST,
} satisfies CreatorProfile;

export const APP_PHILOSOPHY_PRINCIPLES = [
  "Keep each budget entry intentional instead of passively synced.",
  "Build tools that support reflection, not just automation.",
  "Maintain clarity across daily spending and long-term goals.",
] as const;

export const ABOUT_PAGE_CONTENT = {
  hero: {
    eyebrow: "About",
    title: `Why ${APP_NAME} Exists`,
    summary: `I built ${APP_NAME} to turn a scattered budgeting workflow into one focused app.`,
  },
  creator: CREATOR_PROFILE,
  summary: [
    `I started ${APP_NAME} as a side project to simplify how I tracked spending. Managing budgets across multiple tools was working, but it felt fragmented.`,
    "I wanted one place that preserved the clarity of manual tracking without requiring constant tool-switching.",
  ],
  sectionTitles: {
    creator: "About The Creator",
    philosophy: "App Philosophy",
    story: "More About The Product",
  },
  notices: [
    {
      title: "Free To Use",
      body: `${APP_NAME} is free to use while I keep improving it as a personal project.`,
    },
    {
      title: "Keep It Safe",
      body: "Please avoid storing passwords, account numbers, bank credentials, or other sensitive information in the app.",
    },
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
      value: "5+ years",
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
      heading: "Origin Story",
      paragraphs: [
        "I was already tracking spending manually before building this. Spreadsheets for transactions, notes for planning, and a growing sense that switching between them was slowing me down.",
        "I built Porridge Budget to consolidate that workflow without losing the intentionality. The goal was one app that kept manual tracking deliberate, not buried under automatic syncing.",
      ],
    },
    {
      id: "manual-entry",
      heading: "Mindful Manual Entry",
      paragraphs: [
        "Most budgeting tools prioritize bank aggregation. This one prioritizes manual entry because it creates a moment of review and keeps spending visible.",
        "CSV imports are supported for convenience, but the product still assumes you want to stay close to your data.",
      ],
      highlights: [
        "Manual entry is a feature, not a fallback.",
        "Consolidation should reduce tab-switching, not awareness.",
      ],
    },
    {
      id: "product-direction",
      heading: "Product Direction",
      paragraphs: [
        "I want the app to feel personal and focused. Reports, budgets, and progress views should support deliberate planning, not endless configuration.",
        "New features should make the workflow more efficient without removing the sense of ownership that comes from staying involved in the process.",
      ],
    },
  ],
} satisfies AboutPageContent;
