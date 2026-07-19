import type { PageTitleEntry } from "../types/content";

export const APP_NAME = "Porridge Budget";

export const APP_DEFAULT_DESCRIPTION =
  "Track expenses, plan budgets, and review financial progress with a manual-first budgeting app.";

export const ROUTE_PATHS = {
  home: "/",
  about: "/about",
  faq: "/faq",
  contact: "/contact",
  login: "/auth/login",
  register: "/auth/register",
  callback: "/auth/callback",
  signout: "/auth/signout",
  reports: "/reports",
  sankey: "/sankey",
  progress: "/progress",
  salary: "/salary",
  fire: "/fire",
} as const;

export const PAGE_TITLE_KEYS = {
  HOME: "home",
  ABOUT: "about",
  FAQ: "faq",
  CONTACT: "contact",
  LOGIN: "login",
  REGISTER: "register",
  CALLBACK: "callback",
  SIGNOUT: "signout",
  REPORTS: "reports",
  SANKEY: "sankey",
  PROGRESS: "progress",
  SALARY: "salary",
  FIRE: "fire",
} as const;

export type AppRoute = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];
export type PageTitleKey =
  (typeof PAGE_TITLE_KEYS)[keyof typeof PAGE_TITLE_KEYS];

export const PAGE_TITLES = {
  [PAGE_TITLE_KEYS.HOME]: {
    route: ROUTE_PATHS.home,
    title: APP_NAME,
    description: APP_DEFAULT_DESCRIPTION,
  },
  [PAGE_TITLE_KEYS.ABOUT]: {
    route: ROUTE_PATHS.about,
    title: `About - ${APP_NAME}`,
    description:
      "Learn why Porridge Budget was built, who maintains it, and the philosophy behind manual-first budgeting.",
  },
  [PAGE_TITLE_KEYS.FAQ]: {
    route: ROUTE_PATHS.faq,
    title: `FAQ - ${APP_NAME}`,
    description:
      "Common questions about Porridge Budget, the manual-first workflow, and core features.",
  },
  [PAGE_TITLE_KEYS.CONTACT]: {
    route: ROUTE_PATHS.contact,
    title: `Contact - ${APP_NAME}`,
    description:
      "Send a direct message about Porridge Budget or connect through GitHub and LinkedIn.",
  },
  [PAGE_TITLE_KEYS.LOGIN]: {
    route: ROUTE_PATHS.login,
    title: `Sign in - ${APP_NAME}`,
    description:
      "Sign in to review budgets, reports, and other personal finance progress.",
  },
  [PAGE_TITLE_KEYS.REGISTER]: {
    route: ROUTE_PATHS.register,
    title: `Create account - ${APP_NAME}`,
    description:
      "Create an account to start tracking money with a more intentional workflow.",
  },
  [PAGE_TITLE_KEYS.CALLBACK]: {
    route: ROUTE_PATHS.callback,
    title: `Completing sign in - ${APP_NAME}`,
    description:
      "Finish the authentication flow and return the user to the budgeting app.",
  },
  [PAGE_TITLE_KEYS.SIGNOUT]: {
    route: ROUTE_PATHS.signout,
    title: `Sign out - ${APP_NAME}`,
    description:
      "Clear local session state and safely end the current session.",
  },
  [PAGE_TITLE_KEYS.REPORTS]: {
    route: ROUTE_PATHS.reports,
    title: `Reports - ${APP_NAME}`,
    description:
      "Review transactions, charts, and category totals from one spending dashboard.",
    requiresAuth: true,
  },
  [PAGE_TITLE_KEYS.SANKEY]: {
    route: ROUTE_PATHS.sankey,
    title: `Budget - ${APP_NAME}`,
    description:
      "Plan named expenses and visualize a monthly budget with pie and Sankey charts.",
    requiresAuth: true,
  },
  [PAGE_TITLE_KEYS.PROGRESS]: {
    route: ROUTE_PATHS.progress,
    title: `Progress - ${APP_NAME}`,
    description:
      "Follow salary, retirement, and other longer-term financial progress in one place.",
    requiresAuth: true,
  },
  [PAGE_TITLE_KEYS.SALARY]: {
    route: ROUTE_PATHS.salary,
    title: `Salary history - ${APP_NAME}`,
    description:
      "Store yearly salary entries and compare income changes over time.",
    requiresAuth: true,
  },
  [PAGE_TITLE_KEYS.FIRE]: {
    route: ROUTE_PATHS.fire,
    title: `FIRE Calculator - ${APP_NAME}`,
    description:
      "Calculate your Financial Independence number, project investment growth, and compare retirement scenarios.",
    requiresAuth: true,
  },
} satisfies Record<PageTitleKey, PageTitleEntry<AppRoute>>;

export const LIVE_SIGNED_OUT_PAGE_TITLE_KEYS = [
  PAGE_TITLE_KEYS.HOME,
  PAGE_TITLE_KEYS.ABOUT,
  PAGE_TITLE_KEYS.FAQ,
  PAGE_TITLE_KEYS.LOGIN,
  PAGE_TITLE_KEYS.REGISTER,
  PAGE_TITLE_KEYS.CALLBACK,
  PAGE_TITLE_KEYS.SIGNOUT,
] as const;

export const PUBLIC_INFO_PAGE_TITLE_KEYS = [
  PAGE_TITLE_KEYS.ABOUT,
  PAGE_TITLE_KEYS.FAQ,
] as const;

export const PLANNED_PUBLIC_PAGE_TITLE_KEYS = [] as const;

export const AUTHENTICATED_PAGE_TITLE_KEYS = [
  PAGE_TITLE_KEYS.REPORTS,
  PAGE_TITLE_KEYS.SANKEY,
  PAGE_TITLE_KEYS.PROGRESS,
  PAGE_TITLE_KEYS.SALARY,
  PAGE_TITLE_KEYS.FIRE,
] as const;

export const LIVE_PAGE_TITLE_KEYS = [
  PAGE_TITLE_KEYS.HOME,
  PAGE_TITLE_KEYS.ABOUT,
  PAGE_TITLE_KEYS.FAQ,
  PAGE_TITLE_KEYS.LOGIN,
  PAGE_TITLE_KEYS.REGISTER,
  PAGE_TITLE_KEYS.CALLBACK,
  PAGE_TITLE_KEYS.SIGNOUT,
  PAGE_TITLE_KEYS.REPORTS,
  PAGE_TITLE_KEYS.SANKEY,
  PAGE_TITLE_KEYS.PROGRESS,
  PAGE_TITLE_KEYS.SALARY,
  PAGE_TITLE_KEYS.FIRE,
] as const;

const PAGE_TITLES_BY_ROUTE = new Map(
  Object.values(PAGE_TITLES).map((entry) => [entry.route, entry] as const),
);

export function getPageTitleEntry(key: PageTitleKey): PageTitleEntry<AppRoute> {
  return PAGE_TITLES[key];
}

export function normalizeAppPathname(pathname?: string | null) {
  if (!pathname) return ROUTE_PATHS.home;

  const normalizedPathname = pathname.split(/[?#]/)[0]?.replace(/\/+$/, "");

  return normalizedPathname || ROUTE_PATHS.home;
}

export function getPageTitleEntryByPathname(
  pathname?: string | null,
): PageTitleEntry<AppRoute> | undefined {
  return PAGE_TITLES_BY_ROUTE.get(normalizeAppPathname(pathname) as AppRoute);
}
