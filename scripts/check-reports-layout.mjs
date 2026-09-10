// Browser regression check. Run Chrome with an isolated profile and
// --headless --remote-debugging-port=9223, and start the app locally.
// Usage: node scripts/check-reports-layout.mjs [app URL] [Chrome debug URL]
import assert from "node:assert/strict";

const appUrl = process.argv[2] ?? "http://127.0.0.1:3100";
const chromeUrl = process.argv[3] ?? "http://127.0.0.1:9223";
const tabs = await (await fetch(`${chromeUrl}/json`)).json();
const tab = tabs.find((item) => item.type === "page");
assert(tab, "Chrome must have an open page in an isolated test profile");
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));
let nextId = 0;
const pending = new Map();
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  message.error ? request.reject(message.error) : request.resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", {
    expression, awaitPromise: true, returnByValue: true,
  });
  assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitFor = async (expression) => {
  for (let i = 0; i < 120; i++) {
    if (await evaluate(expression)) return;
    await pause(250);
  }
  throw new Error(`Timed out waiting for ${expression}`);
};

try {
  await send("Page.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "sessionStorage.setItem('porridge-budget-demo-session', 'true')",
  });
  await send("Page.navigate", { url: `${appUrl}/reports` });
  await waitFor(`Boolean(document.querySelector('input[placeholder="Name, note, or tag"]'))`);
  const clearActionCount = await evaluate(`Array.from(document.querySelectorAll("button"))
    .filter((button) => button.textContent.trim() === "Clear Filters").length`);
  assert.equal(clearActionCount, 1, "Reports must render one Clear filters action");
  assert.equal(await evaluate(`Array.from(document.querySelectorAll("button"))
    .filter((button) => ["Clear all", "Reset"].includes(button.textContent.trim())).length`), 0,
  "Reports must not render duplicate clear actions");
  // Apply an advanced filter so the active-filter chips are present while the
  // toolbar is measured below. Category is the first advanced autocomplete.
  await evaluate(`document.querySelector('[aria-controls="report-advanced-filters"]').click()`);
  await waitFor(`document.querySelector("#report-advanced-filters").getBoundingClientRect().height > 0`);
  await evaluate(`document.querySelector('#report-advanced-filters input[role="combobox"]').click()`);
  await waitFor(`Array.from(document.querySelectorAll('[role="option"]'))
    .some((option) => option.textContent.trim() === "Need")`);
  await evaluate(`Array.from(document.querySelectorAll('[role="option"]'))
    .find((option) => option.textContent.trim() === "Need").click()`);
  await waitFor(`Boolean(document.querySelector('[aria-label="Active Report Filters"]'))`);
  // Seeded demo data exercises actual charts, transactions, and calendar events.
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width, height: 900, deviceScaleFactor: 1, mobile: false,
    });
    await evaluate(`(() => {
      const toggle = document.querySelector('[aria-controls="report-advanced-filters"]');
      if (toggle.getAttribute("aria-expanded") !== "true") toggle.click();
    })()`);
    await waitFor(`document.querySelector("#report-advanced-filters").getBoundingClientRect().height > 0`);
    const rangeLayout = await evaluate(`(() => {
      const group = (testId) => {
        const element = document.querySelector('[data-testid="' + testId + '"]');
        const fields = Array.from(element.querySelectorAll('.MuiFormControl-root'))
          .map((field) => field.getBoundingClientRect());
        const connector = element.querySelector('[data-testid$="range-connector"]')
          .getBoundingClientRect();
        const bounds = element.getBoundingClientRect();
        return {
          hasLegend: Boolean(element.querySelector('legend')),
          bounds: {
            top: Math.round(bounds.top), bottom: Math.round(bounds.bottom), left: Math.round(bounds.left),
            width: Math.round(bounds.width), right: Math.round(bounds.right),
          },
          fields: fields.map(({ top, width }) => ({ top: Math.round(top), width: Math.round(width) })),
          connector: {
            top: Math.round(connector.top), bottom: Math.round(connector.bottom),
            width: Math.round(connector.width), height: Math.round(connector.height),
          },
        };
      };
      return {
        applyButtons: Array.from(document.querySelectorAll("button"))
          .filter((button) => button.textContent.trim() === "Apply Amount Range").length,
        date: group('report-date-range-group'),
        amount: group('report-amount-range-group'),
        categoryTop: Math.round(
          document.querySelector('#report-advanced-filters .MuiAutocomplete-root')
            .getBoundingClientRect().top,
        ),
      };
    })()`);
    assert.equal(rangeLayout.applyButtons, 0,
      `${width}px: manual amount filters must not render an Apply button`);
    for (const range of [rangeLayout.date, rangeLayout.amount]) {
      assert.equal(range.hasLegend, false,
        `${width}px: paired ranges must not render visible group captions`);
      assert.equal(range.fields.length, 2, `${width}px: each range must render two fields`);
      assert(range.fields.every((field) => field.width >= 80),
        `${width}px: range inputs must remain usable: ${JSON.stringify(range)}`);
      assert(range.bounds.right <= width, `${width}px: range group must not overflow: ${JSON.stringify(range)}`);
      assert(range.connector.width > 0 && range.connector.height > 0,
        `${width}px: range connector must remain visible: ${JSON.stringify(range.connector)}`);
    }
    if (width >= 1200) {
      assert.equal(rangeLayout.date.bounds.top, rangeLayout.amount.bounds.top,
        `${width}px: range panels must share the desktop row`);
      assert(Math.abs(rangeLayout.date.bounds.width - rangeLayout.amount.bounds.width) <= 1,
        `${width}px: range panels must have equal desktop widths: ${JSON.stringify(rangeLayout)}`);
      assert(Math.abs(rangeLayout.amount.bounds.left - rangeLayout.date.bounds.right - 32) <= 1,
        `${width}px: paired ranges need a 32px desktop center gap: ${JSON.stringify(rangeLayout)}`);
      assert(rangeLayout.date.fields.every((field) => field.top === rangeLayout.date.fields[0].top)
        && rangeLayout.amount.fields.every((field) => field.top === rangeLayout.amount.fields[0].top),
      `${width}px: paired range fields must remain horizontal`);
      assert(rangeLayout.categoryTop > rangeLayout.date.bounds.top,
        `${width}px: Category and Tags must remain below the range panels`);
    } else if (width >= 600) {
      assert(rangeLayout.amount.bounds.top > rangeLayout.date.bounds.top,
        `${width}px: range panels must stack at medium widths`);
      assert(rangeLayout.amount.bounds.top - rangeLayout.date.bounds.bottom >= 20
        && rangeLayout.amount.bounds.top - rangeLayout.date.bounds.bottom <= 24,
      `${width}px: stacked range groups need a 20–24px gap: ${JSON.stringify(rangeLayout)}`);
      assert(rangeLayout.date.fields.every((field) => field.top === rangeLayout.date.fields[0].top)
        && rangeLayout.amount.fields.every((field) => field.top === rangeLayout.amount.fields[0].top),
      `${width}px: paired range fields must remain horizontal at medium widths`);
    } else {
      assert(rangeLayout.amount.bounds.top - rangeLayout.date.bounds.bottom >= 20
        && rangeLayout.amount.bounds.top - rangeLayout.date.bounds.bottom <= 24,
      `${width}px: stacked range groups need a 20–24px gap: ${JSON.stringify(rangeLayout)}`);
      for (const range of [rangeLayout.date, rangeLayout.amount]) {
        assert(range.fields[0].top < range.connector.top && range.connector.bottom < range.fields[1].top,
          `${width}px: stacked fields must retain the visible to connector: ${JSON.stringify(range)}`);
      }
    }
    const sectionPadding = await evaluate(`(() => [
      "report-filter-toolbar",
      "report-advanced-filter-panel",
    ].map((testId) => {
      const style = getComputedStyle(
        document.querySelector('[data-testid="' + testId + '"]'),
      );
      return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
    }))()`);
    for (const padding of sectionPadding) {
      assert(padding.every((value) => value === padding[0]),
        `${width}px: filter section padding must be uniform: ${padding}`);
    }
    if (width >= 1024) {
      const chipRow = await evaluate(`(() => {
        const toolbar = document.querySelector('[data-testid="report-filter-toolbar"]');
        const chips = toolbar.querySelector('[aria-label="Active Report Filters"]');
        const controls = [
          toolbar.querySelector('input[placeholder="Name, note, or tag"]'),
          toolbar.querySelector('[aria-label="Choose Date"]'),
          toolbar.querySelector('[aria-label="Choose Amount"]'),
          toolbar.querySelector('[aria-controls="report-advanced-filters"]'),
          Array.from(toolbar.querySelectorAll('button'))
            .find((button) => button.textContent.trim() === "Clear Filters"),
        ];
        return {
          chipTop: Math.round(chips.getBoundingClientRect().top),
          controlsBottom: Math.max(...controls.map(
            (control) => Math.round(control.getBoundingClientRect().bottom),
          )),
        };
      })()`);
      assert(chipRow.chipTop > chipRow.controlsBottom,
        `${width}px: active filters must begin below the toolbar controls: ${JSON.stringify(chipRow)}`);
    }
    for (const view of ["Table", "Calendar"]) {
      await evaluate(`document.querySelector('[aria-label="${view} view"]').click()`);
      await waitFor(view === "Table"
        ? 'Boolean(document.querySelector(".MuiTablePagination-root"))'
        : 'Boolean(document.querySelector(".fc-daygrid-body"))');
      await pause(1500);
      const bounds = await evaluate(`(() => {
        window.scrollTo(100000, 100000);
        const root = document.documentElement;
        const footer = document.querySelector('footer').getBoundingClientRect();
        const live = document.querySelector('[role="status"][aria-live="polite"]').getBoundingClientRect();
        return {
          viewport: root.clientWidth, width: root.scrollWidth,
          height: root.scrollHeight, footerBottom: footer.bottom + scrollY,
          scrollX, liveWidth: live.width, liveHeight: live.height,
        };
      })()`);
      assert.equal(bounds.width, bounds.viewport, `${width}/${view}: horizontal overflow`);
      assert.equal(bounds.scrollX, 0, `${width}/${view}: document scrolled sideways`);
      assert(Math.abs(bounds.height - bounds.footerBottom) <= 1,
        `${width}/${view}: space after footer: ${JSON.stringify(bounds)}`);
      assert.equal(bounds.liveWidth, 1, "Live region must be one pixel wide");
      assert.equal(bounds.liveHeight, 1, "Live region must be one pixel tall");
      if (view === "Table" && width < 768) {
        const localScroll = await evaluate(`(() => {
          const table = document.querySelector('[aria-label="Transaction results table"]');
          table.scrollLeft = 100;
          return {left: table.scrollLeft, documentLeft: window.scrollX};
        })()`);
        assert(localScroll.left > 0, "Wide table must remain locally scrollable");
        assert.equal(localScroll.documentLeft, 0, "Table scroll must not move the document");
      }
      console.log(`PASS ${width}px ${view}: document ends at footer; no horizontal overflow`);
    }
  }
} finally {
  socket.close();
}
