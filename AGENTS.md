# AGENTS.md

Static-site mirror of `artsofoptics.com`, rebranded to **JP**, wrapped in Next.js 16 (App Router, Turbopack).

## Commands

- `npm run dev` / `npm run build` / `npm start`
- `npx tsc --noEmit` — only typecheck; there is no lint, test, or format setup.
- `npm run enhance` — rebuild `public/search-index.json` then re-inject UI tags. Run after editing mirrored HTML or `jp-ui.*`.
- `npm run mirror` — full re-crawl, then rebrand, search index, and UI injection. Requires network and Google Chrome at the hardcoded path `C:\Program Files\Google\Chrome\Application\chrome.exe` (uses `puppeteer-core`). Slow and rewrites most tracked files.

## How the site is wired

- **Not a normal Next app.** Pages are pre-rendered HTML in `public/`, served through rewrites in `next.config.mjs`:
  - `/` → `/index.html`
  - each entry in `mirror-manifest.json` → `/mirror/<file>.html` (query strings matched via `match`)
  - `app/[...slug]/page.tsx` is only a placeholder for routes not in the manifest; `app/page.tsx` returns `null`.
- Homepage lives in `public/index.html`. Root `index.html` is a secondary homepage copy (also processed by rebrand). `index.original.html` is gitignored raw capture.
- Content dirs:
  - `public/mirror/` — 252 mined pages (products, collections, policies)
  - `public/mirror-assets/` — hashed downloaded images
  - `public/media/` — Firebase bucket assets after path rewriting
  - `public/site-assets/` — mirrored `_next` assets
  - `public/jp-ui.css` + `public/jp-ui.js` — the real customization layer (search, cart/account localStorage, carousels, filters). `jp-ui.js` fetches `/search-index.json` and `/mirror/shop-type-frame-optical.html`.
- Metadata lives in `app/layout.tsx`.

## Pipeline (order matters)

`scripts/mirror.mjs` (crawl/live fetch) → `scripts/rebrand.mjs` (localize assets, strip external scripts/CDNs, replace brand/domain/email) → `scripts/build-search-index.mjs` (parse manifest pages → `public/search-index.json`) → `scripts/enhance-ui.mjs` (inject `/jp-ui.css` + `/jp-ui.js` into every `public/index.html` and `public/mirror/*.html`; has a hardcoded about-us hero transform).

- Run scripts from the repo root; they rely on `process.cwd()` and relative paths.
- Do **not** hand-edit `public/mirror/*.html` for lasting changes: `mirror`/`rebrand` overwrite them. Prefer `jp-ui.css`/`jp-ui.js`, or adjust the scripts.
- Changes to mirrored HTML are tracked in git; regeneration yields very large diffs. Commit generated files deliberately.
- Root capture dirs (`artsofoptics-com/`, `firebasestorage-googleapis-com/`, `www-*`, etc.) and `.mirror-cache/` are intermediate and gitignored; don't edit them.

## Adding a route

Add/keep the HTML under `public/mirror/`, add an entry to `mirror-manifest.json`, then run `npm run enhance`. Without a manifest entry the catch-all placeholder is shown.
