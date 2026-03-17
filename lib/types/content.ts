/**
 * Note 1: These interfaces keep page copy and metadata in plain TypeScript
 * objects so page components can stay focused on layout, accessibility, and
 * rendering concerns.
 */

export type SocialPlatform = "github" | "linkedin";

export type FaqCategory =
  | "creator"
  | "philosophy"
  | "workflow"
  | "features"
  | "data";

// Note 2: The `Href` generic lets one link shape describe internal route unions
// and external URLs without giving up autocomplete in consumers.
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

export interface ContactPageContent {
  hero: ContentHero;
  summary: readonly string[];
  form: ContactFormContent;
  methods: readonly ContactMethod[];
  topics: readonly string[];
  availabilityNote: string;
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

// Note 3: Route metadata is separated from actual page components so titles and
// descriptions can be reused by layouts, tests, and future content-driven UI.
export interface PageTitleEntry<Route extends string = string> {
  route: Route;
  title: string;
  description: string;
  requiresAuth?: boolean;
  planned?: boolean;
}
