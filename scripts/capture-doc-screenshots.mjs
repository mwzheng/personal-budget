// Start the app and an isolated headless Chrome with remote debugging enabled.
// See docs/screenshots/README.md for the complete commands.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const appUrl = process.argv[2] ?? "http://127.0.0.1:3100";
const chromeUrl = process.argv[3] ?? "http://127.0.0.1:9223";
const tabs = await (await fetch(`${chromeUrl}/json`)).json();
const tab = tabs.find((item) => item.type === "page");
assert(tab, "Open a page in the isolated Chrome profile first");
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
const outputDir = new URL("../docs/screenshots/", import.meta.url);

try {
  await mkdir(outputDir, { recursive: true });
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  });
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `sessionStorage.setItem('porridge-budget-demo-session', 'true');
      localStorage.setItem('pb:theme-mode', 'light');
      localStorage.removeItem('porridge-budget-demo-store');`,
  });
  for (const route of ["reports", "budget", "progress", "salary", "fire"]) {
    await send("Page.navigate", { url: `${appUrl}/${route}` });
    let ready = false;
    for (let attempt = 0; attempt < 180; attempt++) {
      try {
      ready = await evaluate(`location.pathname === ${JSON.stringify(`/${route}`)}
        && document.readyState === "complete"
        && Boolean(document.querySelector('main'))
        && Boolean(document.querySelector('main svg'))
        && !document.querySelector('.MuiCircularProgress-root')`);
      } catch (error) {
        if (!/Execution context was destroyed|Cannot find context/.test(error.message ?? String(error))) throw error;
        ready = false;
      }
      if (ready) break;
      await pause(500);
    }
    assert(ready, `Timed out loading /${route}`);
    await evaluate("document.fonts.ready.then(() => true)");
    await pause(2500);
    await evaluate(`(() => {
      document.querySelector('nextjs-portal')?.remove();
      window.scrollTo(0, 0);
    })()`);
    const { contentSize } = await send("Page.getLayoutMetrics");
    const { data } = await send("Page.captureScreenshot", {
      format: "png", captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: 1440, height: Math.ceil(contentSize.height), scale: 1 },
    });
    await writeFile(new URL(`${route}.png`, outputDir), Buffer.from(data, "base64"));
    console.log(`Captured /${route} at 1440 x ${Math.ceil(contentSize.height)}`);
  }
} finally {
  socket.close();
}
