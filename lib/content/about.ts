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
    label: "GitHub",
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
    "5+ years of experience, currently working full time, and interested in building useful tools for everyday life.",
  bio: [
    "I'm a full stack software engineer who likes building practical tools around real workflows.",

    `${APP_NAME} started as a way to grow as a developer while building a budgeting tool I would use myself.`,
  ],
  links: CREATOR_SOCIAL_LINK_LIST,
} satisfies CreatorProfile;

export const APP_PHILOSOPHY_PRINCIPLES = [
  "Enter transactions yourself or import them from a CSV file.",
  "Compare your spending with your plans.",
  "Track savings goals alongside everyday spending.",
] as const;

export const ABOUT_PAGE_CONTENT = {
  hero: {
    eyebrow: "About",
    title: `Why ${APP_NAME} Exists`,
    summary: `I built ${APP_NAME} to make it easier to track spending and plan for the future.`,
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
        "I tracked my spending in spreadsheets and kept planning notes elsewhere. Switching between them made it harder to see everything in one place.",
        "I built Porridge Budget to bring that work together and to learn as a developer. I wanted a tool I would use myself, and one that could help others get started with budgeting and financial planning.",
      ],
    },
    {
      id: "manual-entry",
      heading: "Mindful Manual Entry",
      paragraphs: [
        "You can enter income and expenses yourself, or import transactions from a CSV file. The app does not connect to your bank.",
        "Reports show where your money went, and the budget planner lets you compare planned amounts with recorded transactions.",
      ],
      highlights: [
        "Record income and expenses at your own pace.",
        "Review spending and plans in one place.",
      ],
    },
    {
      id: "product-direction",
      heading: "Product Direction",
      paragraphs: [
        "You can also track salary and retirement savings, set milestones, and explore financial independence scenarios.",
        "This is a free personal project that I continue to improve.",
      ],
    },
  ],
} satisfies AboutPageContent;
