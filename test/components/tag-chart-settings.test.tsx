// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagChartSettings } from "@/components/charts/TagChartSettings";

afterEach(cleanup);

describe("Top Tags settings", () => {
  it("shows every available or previously excluded tag and updates exclusions", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TagChartSettings
        availableTags={["eating out", "rent"]}
        excludedTags={["old tag"]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Top Tags settings" }));

    expect(screen.getByText("eating out")).toBeTruthy();
    expect(screen.getByText("rent")).toBeTruthy();
    expect(screen.getByText("old tag")).toBeTruthy();

    await user.click(
      screen.getByRole("checkbox", { name: "Exclude rent from Top Tags" }),
    );
    expect(onChange).toHaveBeenLastCalledWith(["old tag", "rent"]);
  });

  it("clears all exclusions", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TagChartSettings
        availableTags={["rent"]}
        excludedTags={["rent", "eating out"]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Top Tags settings" }));
    await user.click(screen.getByRole("button", { name: "Clear all" }));

    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
