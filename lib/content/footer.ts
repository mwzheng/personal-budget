/**
 * Note 1: Footer content is modeled as data because it will likely be reused by
 * the signed-out shell, public pages, and any future marketing layout.
 */

import type {
  FooterContent,
  FooterLinkGroup,
  LinkDefinition,
} from "../types/content";
import { CREATOR_SOCIAL_LINK_LIST } from "./about";
import {
  APP_DEFAULT_DESCRIPTION,
  APP_NAME,
  PAGE_TITLE_KEYS,
  PAGE_TITLES,
  ROUTE_PATHS,
  type AppRoute,
} from "./page-titles";

export const FOOTER_PUBLIC_LINKS = [
  {
    label: "Home",
    href: ROUTE_PATHS.home,
    description: PAGE_TITLES[PAGE_TITLE_KEYS.HOME].description,
  },
  {
    label: "About",
    href: ROUTE_PATHS.about,
    description: PAGE_TITLES[PAGE_TITLE_KEYS.ABOUT].description,
  },
  {
    label: "FAQ",
    href: ROUTE_PATHS.faq,
    description: PAGE_TITLES[PAGE_TITLE_KEYS.FAQ].description,
  },
  {
    label: "Contact",
    href: ROUTE_PATHS.contact,
    description: PAGE_TITLES[PAGE_TITLE_KEYS.CONTACT].description,
  },
] as const satisfies readonly LinkDefinition<AppRoute>[];

// Note 1.1: An empty placeholder group is still exported so future public pages
// can be staged in data without touching the footer component again.
export const FOOTER_PLANNED_PUBLIC_LINKS: readonly LinkDefinition<AppRoute>[] =
  [];

export const FOOTER_ACCOUNT_LINKS = [
  {
    label: "Sign in",
    href: ROUTE_PATHS.login,
    description: PAGE_TITLES[PAGE_TITLE_KEYS.LOGIN].description,
  },
  {
    label: "Create account",
    href: ROUTE_PATHS.register,
    description: PAGE_TITLES[PAGE_TITLE_KEYS.REGISTER].description,
  },
] as const satisfies readonly LinkDefinition<AppRoute>[];

// Note 2: Grouping links by intent keeps the data flexible for stacked mobile
// footers, horizontal desktop footers, or sitemap-style rendering later.
export const FOOTER_NAVIGATION_GROUPS = [
  {
    title: "Explore",
    links: FOOTER_PUBLIC_LINKS,
  },
  {
    title: "Account",
    links: FOOTER_ACCOUNT_LINKS,
  },
] as const satisfies readonly FooterLinkGroup<AppRoute>[];

export const FOOTER_PLANNED_NAVIGATION_GROUPS: readonly FooterLinkGroup<AppRoute>[] =
  [];

export const FOOTER_CONTENT = {
  brandName: APP_NAME,
  tagline: "Mindful budgeting without the tab switching.",
  description: APP_DEFAULT_DESCRIPTION,
  copyrightOwner: APP_NAME,
  navigationGroups: FOOTER_NAVIGATION_GROUPS,
  plannedNavigationGroups: FOOTER_PLANNED_NAVIGATION_GROUPS,
  socialLinks: CREATOR_SOCIAL_LINK_LIST,
  footnotes: [],
} satisfies FooterContent<AppRoute>;
