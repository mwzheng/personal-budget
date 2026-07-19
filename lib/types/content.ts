export type SocialPlatform = "github" | "linkedin" | "projectGithub";

export type FaqCategory =
  "creator" | "philosophy" | "workflow" | "features" | "data";

export interface LinkDefinition<Href extends string = string> {
  label: string;
  href: Href;
  description?: string;
  external?: boolean;
  planned?: boolean;
}

export interface SocialLink extends LinkDefinition {
  platform: SocialPlatform;
  handle: string;
}

export interface ContentHero {
  eyebrow?: string;
  title: string;
  summary: string;
}

export interface ContentNotice {
  title: string;
  body: string;
}

export interface FactItem {
  label: string;
  value: string;
}

export interface ContentSection {
  id: string;
  heading: string;
  paragraphs: readonly string[];
  highlights?: readonly string[];
}

export interface CreatorProfile {
  name: string;
  role: string;
  experienceSummary: string;
  bio: readonly string[];
  links: readonly SocialLink[];
}

export interface AboutPageContent {
  hero: ContentHero;
  creator: CreatorProfile;
  summary: readonly string[];
  sectionTitles: {
    creator: string;
    philosophy: string;
    story: string;
  };
  notices: readonly ContentNotice[];
  facts: readonly FactItem[];
  principles: readonly string[];
  sections: readonly ContentSection[];
}

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

export interface FaqPageContent {
  hero: ContentHero;
  intro: {
    heading: string;
    description: string;
  };
  items: readonly FaqItem[];
}

export interface ContactMethod extends LinkDefinition {
  cta: string;
  platform?: SocialPlatform;
}

export interface ContactFormFieldContent {
  label: string;
  helperText?: string;
  placeholder?: string;
  autoComplete?: string;
}

export interface ContactFormContent {
  title: string;
  description: string;
  submitLabel: string;
  submittingLabel: string;
  privacyNote: string;
  validationMessage: string;
  successMessage: string;
  errorMessage: string;
  fields: {
    name: ContactFormFieldContent;
    email: ContactFormFieldContent;
    subject: ContactFormFieldContent;
    message: ContactFormFieldContent;
  };
}

export interface ContactSectionContent {
  hero: ContentHero;
  form: ContactFormContent;
  sidebar: {
    title: string;
    topicsTitle: string;
  };
  methods: readonly ContactMethod[];
  topics: readonly string[];
  availabilityNote: string;
}

export interface HomeFeatureCardContent {
  id: "transactions" | "reports" | "budget" | "fire" | "progress";
  title: string;
  description: string;
  supportingCopy: string;
}

export interface HomePageContent {
  hero: ContentHero;
  features: readonly HomeFeatureCardContent[];
}

export interface FooterLinkGroup<Href extends string = string> {
  title: string;
  links: readonly LinkDefinition<Href>[];
}

export interface FooterContent<Href extends string = string> {
  brandName: string;
  tagline: string;
  description: string;
  copyrightOwner: string;
  navigationGroups: readonly FooterLinkGroup<Href>[];
  plannedNavigationGroups?: readonly FooterLinkGroup<Href>[];
  socialLinks: readonly SocialLink[];
  footnotes: readonly string[];
}

export interface PageTitleEntry<Route extends string = string> {
  route: Route;
  title: string;
  description: string;
  requiresAuth?: boolean;
  planned?: boolean;
}
