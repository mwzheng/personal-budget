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
] as const satisfies readonly LinkDefinition<AppRoute>[];

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
