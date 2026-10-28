# Screenshot Capture

The README images show the live app at a 1440px desktop width in Light mode. The capture script resets seeded browser demo data before each page and saves full-page PNGs for Reports, Budget Planner, Savings Progress, Salary History, and FIRE Calculator. It does not capture the redesign prototype.

Use Node.js 22 or later for the built-in WebSocket client. Install dependencies with `pnpm install`, then start the app:

```bash
pnpm dev --port 3100
```

Launch a separate Chrome process with an isolated profile. On macOS:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --remote-debugging-port=9223 \
  --user-data-dir=/tmp/porridge-docs-chrome about:blank
```

Use your platform's Chrome executable on other systems. Keep this profile separate from your personal browser. Run the capture in another terminal:

```bash
node scripts/capture-doc-screenshots.mjs
```

Optional arguments override the app and Chrome debugging URLs:

```bash
node scripts/capture-doc-screenshots.mjs http://127.0.0.1:3100 http://127.0.0.1:9223
```

Review the images before committing. The selected report year follows the current date, while seeded transactions have fixed dates. If a later year produces empty reports, choose a year containing demo transactions and document that capture setting. The FIRE screen shows default projections; browser demo mode does not support saving FIRE scenarios. Stop the isolated Chrome and development server when finished.
