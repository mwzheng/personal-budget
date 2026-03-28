// Note 1: These assertions focus on shared content invariants so public-page copy
// can evolve without silently dropping routes, footer links, or required form text.
import { describe, expect, it } from "vitest";

import { ABOUT_PAGE_CONTENT, CREATOR_SOCIAL_LINKS } from "@/lib/content/about";
import { CONTACT_PAGE_CONTENT } from "@/lib/content/contact";
import { FOOTER_PUBLIC_LINKS } from "@/lib/content/footer";
import { FAQ_ITEMS } from "@/lib/content/faq";
import { HOME_PAGE_CONTENT } from "@/lib/content/home";
import {
  LIVE_SIGNED_OUT_PAGE_TITLE_KEYS,
  PAGE_TITLE_KEYS,
  PAGE_TITLES,
  PUBLIC_INFO_PAGE_TITLE_KEYS,
  ROUTE_PATHS,
} from "@/lib/content/page-titles";

const PUBLIC_PAGE_EXPECTATIONS = [
  {
    key: PAGE_TITLE_KEYS.ABOUT,
    route: ROUTE_PATHS.about,
    label: "About",
  },
  {
    key: PAGE_TITLE_KEYS.FAQ,
    route: ROUTE_PATHS.faq,
    label: "FAQ",
  },
  {
    key: PAGE_TITLE_KEYS.CONTACT,
    route: ROUTE_PATHS.contact,
    label: "Contact",
  },
] as const;

const REQUIRED_CONTACT_FIELDS = [
  "name",
  "email",
  "subject",
  "message",
] as const;

describe("content data invariants", () => {
  it("keeps About, FAQ, and Contact registered as live public page titles", () => {
    expect(PUBLIC_INFO_PAGE_TITLE_KEYS).toEqual(
      expect.arrayContaining(PUBLIC_PAGE_EXPECTATIONS.map(({ key }) => key)),
    );
    expect(LIVE_SIGNED_OUT_PAGE_TITLE_KEYS).toEqual(
      expect.arrayContaining(PUBLIC_PAGE_EXPECTATIONS.map(({ key }) => key)),
    );

    for (const { key, route } of PUBLIC_PAGE_EXPECTATIONS) {
      const entry = PAGE_TITLES[key];

      expect(entry.route).toBe(route);
      expect(entry.title.trim().length).toBeGreaterThan(0);
      expect(entry.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps footer public links aligned with the live public pages", () => {
    for (const { key, label, route } of PUBLIC_PAGE_EXPECTATIONS) {
      expect(FOOTER_PUBLIC_LINKS).toContainEqual({
        label,
        href: route,
        description: PAGE_TITLES[key].description,
      });
    }
  });

  it("publishes FAQ items with non-empty questions and answers", () => {
    expect(FAQ_ITEMS.length).toBeGreaterThan(0);
    expect(new Set(FAQ_ITEMS.map((item) => item.id)).size).toBe(
      FAQ_ITEMS.length,
    );

    for (const item of FAQ_ITEMS) {
      expect(item.question.trim().length).toBeGreaterThan(0);
      expect(item.answer.trim().length).toBeGreaterThan(0);
      expect(item.category.trim().length).toBeGreaterThan(0);
    }
  });

  it("defines contact form copy for every required field", () => {
    const { form } = CONTACT_PAGE_CONTENT;

    expect(form.title.trim().length).toBeGreaterThan(0);
    expect(form.description.trim().length).toBeGreaterThan(0);
    expect(form.submitLabel.trim().length).toBeGreaterThan(0);
    expect(form.validationMessage.trim().length).toBeGreaterThan(0);
    expect(form.successMessage.trim().length).toBeGreaterThan(0);

    for (const fieldName of REQUIRED_CONTACT_FIELDS) {
      const field = form.fields[fieldName];

      expect(field.label.trim().length).toBeGreaterThan(0);
      expect(field.helperText.trim().length).toBeGreaterThan(0);
    }

    expect(form.fields.name.autoComplete).toBe("name");
    expect(form.fields.email.autoComplete).toBe("email");
  });

  it("keeps About, Contact, and Home content aligned with the latest public copy rules", () => {
    expect(ABOUT_PAGE_CONTENT.hero.title).toBe("Why Porridge Budget Exists");
    expect(ABOUT_PAGE_CONTENT.notices).toHaveLength(2);
    expect(ABOUT_PAGE_CONTENT.sectionTitles).toEqual({
      creator: "About The Creator",
      philosophy: "App Philosophy",
      story: "More About The Product",
    });
    expect(
      ABOUT_PAGE_CONTENT.sections.map((section) => section.heading),
    ).toEqual(["Origin Story", "Mindful Manual Entry", "Product Direction"]);
    expect(CREATOR_SOCIAL_LINKS.github.description?.toLowerCase()).toContain(
      "profile",
    );
    expect(
      CREATOR_SOCIAL_LINKS.github.description?.toLowerCase(),
    ).not.toContain("follow the code");

    expect(CONTACT_PAGE_CONTENT.sidebar).toEqual({
      methodsTitle: "Other Ways To Connect",
      methodsDescription:
        "If a public thread or professional introduction makes more sense, these channels stay available too.",
      topicsTitle: "Good Reasons To Reach Out",
    });
    expect(CONTACT_PAGE_CONTENT.notices).toHaveLength(2);
    expect(
      CONTACT_PAGE_CONTENT.methods[0]?.description.toLowerCase(),
    ).toContain("github profile");

    expect(HOME_PAGE_CONTENT.hero.title).toBe("Porridge Budget");
    expect(HOME_PAGE_CONTENT.features.map((feature) => feature.id)).toEqual([
      "transactions",
      "budgets",
      "reports",
      "budget",
    ]);
    expect(
      HOME_PAGE_CONTENT.features.every(
        (feature) =>
          feature.title.trim().length > 0 &&
          feature.description.trim().length > 0,
      ),
    ).toBe(true);
  });
});
