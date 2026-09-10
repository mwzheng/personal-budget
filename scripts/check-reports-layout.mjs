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
    const amountLayout = await evaluate(`(() => {
      const fields = Array.from(
        document.querySelectorAll('[data-testid="report-amount-filter"] .MuiFormControl-root'),
      ).map((field) => field.getBoundingClientRect());
      return {
        applyButtons: Array.from(document.querySelectorAll("button"))
          .filter((button) => button.textContent.trim() === "Apply Amount Range").length,
        fields: fields.map(({ top, width, left, right }) => ({
          top: Math.round(top), width: Math.round(width),
          left: Math.round(left), right: Math.round(right),
        })),
      };
    })()`);
    assert.equal(amountLayout.applyButtons, 0,
      `${width}px: manual amount filters must not render an Apply button`);
    assert.equal(amountLayout.fields.length, 2,
      `${width}px: amount filter must render two bounds`);
    assert(amountLayout.fields.every((field) => field.top === amountLayout.fields[0].top),
      `${width}px: amount bounds must remain aligned: ${JSON.stringify(amountLayout.fields)}`);
    assert(amountLayout.fields.every((field) => field.width >= 80),
      `${width}px: amount bounds must remain usable: ${JSON.stringify(amountLayout.fields)}`);
    assert(Math.abs(amountLayout.fields[0].width - amountLayout.fields[1].width) <= 1,
      `${width}px: amount bounds must be equally sized: ${JSON.stringify(amountLayout.fields)}`);
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
    if (width >= 1440) {
      const filterRows = await evaluate(`(() => {
        const primaryFields = Array.from(
          document.querySelectorAll("#report-advanced-filters .MuiFormControl-root"),
        );
        const amountFields = Array.from(
          document.querySelectorAll(
            '[data-testid="report-amount-filter"] .MuiFormControl-root',
          ),
        );
        return {
          primary: primaryFields.slice(0, 4).map((field) => Math.round(field.getBoundingClientRect().top)),
          secondary: primaryFields.slice(4, 6).map((field) => Math.round(field.getBoundingClientRect().top)),
          amount: amountFields.map((field) => Math.round(field.getBoundingClientRect().top)),
          startDateWidth: Math.round(primaryFields[0].getBoundingClientRect().width),
          endDateWidth: Math.round(primaryFields[1].getBoundingClientRect().width),
          amountActionsRight: Math.round(
            document.querySelector('[data-testid="report-amount-actions"]').getBoundingClientRect().right,
          ),
        };
      })()`);
      assert.equal(filterRows.primary.length, 4, "Advanced filters must render four primary fields");
      assert(filterRows.primary.every((top) => top === filterRows.primary[0]),
        `${width}px: primary fields must share a desktop row: ${filterRows.primary}`);
      assert.equal(filterRows.amount.length, 2, "Amount filter must render two bounds");
      assert(filterRows.amount.every((top) => top === filterRows.amount[0]),
        `${width}px: amount controls must share a desktop row: ${filterRows.amount}`);
      assert(filterRows.startDateWidth >= 180 && filterRows.endDateWidth >= 180,
        `${width}px: date fields must be wide enough for complete values: ${JSON.stringify(filterRows)}`);
      assert.equal(filterRows.secondary.length, 2, "Advanced filters must render Category and Tags");
      assert(filterRows.secondary.every((top) => top === filterRows.secondary[0]),
        `${width}px: Category and Tags must share a desktop row: ${filterRows.secondary}`);
      assert(filterRows.secondary[0] > filterRows.primary[0],
        `${width}px: Category and Tags must be on the row below the range controls`);
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
