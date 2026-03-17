/**
 * Note 1: Contact details live in data form so the future contact page, footer,
 * and any call-to-action components can reuse the same public information.
 */

import type { ContactMethod, ContactPageContent } from "../types/content";
import { CREATOR_SOCIAL_LINKS } from "./about";
import { APP_NAME } from "./page-titles";

export const CONTACT_METHODS = [
  {
    label: CREATOR_SOCIAL_LINKS.github.label,
    href: CREATOR_SOCIAL_LINKS.github.href,
    platform: CREATOR_SOCIAL_LINKS.github.platform,
    external: true,
    cta: "Visit GitHub",
    description:
      "Best for browsing my GitHub profile and broader developer presence.",
  },
  {
    label: CREATOR_SOCIAL_LINKS.linkedin.label,
    href: CREATOR_SOCIAL_LINKS.linkedin.href,
    platform: CREATOR_SOCIAL_LINKS.linkedin.platform,
    external: true,
    cta: "Visit LinkedIn",
    description:
      "Best for professional introductions, career context, or a short note about the project.",
  },
] as const satisfies readonly ContactMethod[];

// Note 2: The response note sets expectation early because this project is a
// hobby build maintained around full-time work rather than a staffed product.
export const CONTACT_PAGE_CONTENT = {
  hero: {
    eyebrow: "Contact",
    title: `Get In Touch About ${APP_NAME}`,
    summary:
      "Use the contact form below for a direct reply, or reach out through GitHub and LinkedIn when a public or professional channel fits better.",
  },
  summary: [
    `${APP_NAME} is free to use and something I maintain alongside my full-time software engineering work.`,
    "Questions, thoughtful feedback, bug reports, and small product ideas are all welcome.",
  ],
  form: {
    title: "Send A Message",
    description:
      "Use the form for direct questions about the product, workflow feedback, or a quick hello. Messages are delivered by email so I can reply without publishing a personal inbox on the page.",
    submitLabel: "Send message",
    submittingLabel: "Sending message…",
    privacyNote:
      "Your email address is only used to deliver this message and make a reply possible.",
    validationMessage: "Please review the highlighted fields and try again.",
    successMessage:
      "Thanks for reaching out. Your message has been sent successfully.",
    errorMessage:
      "We couldn't send your message just now. Please try again in a moment or use GitHub or LinkedIn instead.",
    fields: {
      name: {
        label: "Name",
        helperText: "How you'd like to be addressed in a reply.",
        autoComplete: "name",
      },
      email: {
        label: "Email",
        helperText: "Used only for this reply.",
        autoComplete: "email",
      },
      subject: {
        label: "Subject",
        helperText: "A short summary helps me triage messages quickly.",
      },
      message: {
        label: "Message",
        helperText:
          "Share the question, context, or feedback you have in mind.",
      },
    },
  },
  sidebar: {
    methodsTitle: "Other Ways To Connect",
    methodsDescription:
      "If a public thread or professional introduction makes more sense, these channels stay available too.",
    topicsTitle: "Good Reasons To Reach Out",
  },
  notices: [
    {
      title: "Free To Use",
      body: `${APP_NAME} is free to use, so support and replies happen around my full-time schedule.`,
    },
    {
      title: "Keep It Safe",
      body: "Please avoid sending passwords, account numbers, bank credentials, or other sensitive information through this form.",
    },
  ],
  methods: CONTACT_METHODS,
  topics: [
    "Feedback on the manual budgeting workflow",
    "Bug reports, rough edges, or missing content",
    "Questions about the Excel-plus-Notion origin story",
    "Thoughtful feature ideas that preserve the manual-first approach",
    "General collaboration or professional conversation",
  ],
  availabilityNote:
    "I read these channels personally, but replies may be asynchronous because I maintain the project outside of full-time work.",
} satisfies ContactPageContent;
