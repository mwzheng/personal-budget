import type { ContactMethod, ContactSectionContent } from "../types/content";
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

export const CONTACT_SECTION_CONTENT = {
  hero: {
    title: "Get In Touch",
    summary: `Questions, bug reports, and product ideas are all welcome. ${APP_NAME} is free and maintained alongside full-time work, so replies may take a moment.`,
  },
  form: {
    title: "Send A Message",
    description:
      "Use the form for direct questions about the product, workflow feedback, or a quick hello. Messages are delivered by email so I can reply without publishing a personal inbox on the page.",
    submitLabel: "Send message",
    submittingLabel: "Sending message…",
    privacyNote:
      "Your email address is only used to deliver this message and make a reply possible. Please avoid sending passwords, account numbers, or other sensitive information through this form.",
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
    title: "Other Ways To Connect",
    topicsTitle: "Good Reasons To Reach Out",
  },
  methods: CONTACT_METHODS,
  topics: [
    "Feedback on the manual budgeting workflow",
    "Bug reports, rough edges, or missing content",
    "Questions about the manual-first approach",
    "Feature ideas that preserve the simple philosophy",
    "General collaboration or conversation",
  ],
  availabilityNote:
    "I read these channels personally, but replies may be asynchronous because I maintain the project outside of full-time work.",
} satisfies ContactSectionContent;
