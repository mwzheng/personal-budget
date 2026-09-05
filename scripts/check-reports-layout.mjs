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
  // Seeded demo data exercises actual charts, transactions, and calendar events.
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width, height: 900, deviceScaleFactor: 1, mobile: false,
    });
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
