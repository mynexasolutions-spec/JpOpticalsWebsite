import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer-core';

const ORIGIN = 'https://artsofoptics.com';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'mirror');
const ASSET_DIR = path.join(ROOT, 'public', 'mirror-assets');
const CACHE_DIR = path.join(ROOT, '.mirror-cache');
const MANIFEST = path.join(ROOT, 'mirror-manifest.json');
const MAX_PAGES = 250;
const CONCURRENCY = 3;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const log = (...args) => console.log(new Date().toISOString().slice(11, 19), ...args);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
const existingAssets = new Map();

const STATIC_PAGES = new Set([
  '/shop',
  '/about-us',
  '/contact-us',
  '/special-offers',
  '/ship-glasses',
  '/cart',
  '/profile',
  '/privacy-policy',
  '/refund-policy',
  '/shipping-policy',
  '/terms-of-service',
  '/help/faq',
  '/help/track-order',
]);

function canonicalize(raw) {
  let url;
  try {
    url = new URL(raw, ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== ORIGIN) return null;
  const p = url.pathname.replace(/\/+$/, '') || '/';

  if (/^\/(product|collection)\/\d+$/.test(p) || /^\/lenses\/\d+$/.test(p)) {
    return p;
  }
  if (p === '/shop') {
    const params = [...url.searchParams.entries()].filter(
      ([key, value]) => !(key === 'page' && value === '1'),
    );
    params.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
    return p + (params.length ? `?${new URLSearchParams(params).toString()}` : '');
  }
  if (STATIC_PAGES.has(p) || /^\/help\/[a-z-]+$/.test(p)) return p;
  return null;
}

async function readHomepageSeeds() {
  try {
    const html = await fs.readFile(path.join(ROOT, 'public', 'index.html'), 'utf8');
    const seeds = [];
    for (const m of html.matchAll(/href="([^"]+)"/g)) {
      const c = canonicalize(m[1].replaceAll('&amp;', '&'));
      if (c) seeds.push(c);
    }
    return seeds;
  } catch {
    return [];
  }
}

async function render(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1800 });
  await page.setUserAgent(UA);
  let html = '';
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    try {
      await page.waitForNetworkIdle({ idleTime: 1200, timeout: 20000 });
    } catch {}
    await sleep(1800);
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let y = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, 900);
          y += 900;
          if (y > document.body.scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 90);
      });
    });
    await sleep(1200);
    html = await page.content();
    const links = await page.$$eval('a[href]', (as) => as.map((a) => a.href));
    return { html, links };
  } finally {
    await page.close().catch(() => {});
  }
}

function removeScripts(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*\/>/gi, '');
}

function stripScripts(html) {
  return removeScripts(html)
    .replace(/<link\b[^>]*\bas="script"[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel="modulepreload"[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel="preload"[^>]*\bas="image"[^>]*>/gi, '');
}

function decodeAmp(s) {
  return s.replaceAll('&amp;', '&');
}

function optimizeExtFromUrl(raw) {
  try {
    const p = new URL(raw).pathname;
    const m = p.match(/\.(png|jpe?g|webp|avif|svg|gif)$/i);
    if (m) return `.${m[1].toLowerCase().replace('jpeg', 'jpg')}`;
  } catch {}
  return null;
}

function extFromType(type) {
  if (!type) return null;
  if (type.includes('image/webp')) return '.webp';
  if (type.includes('image/avif')) return '.avif';
  if (type.includes('image/svg')) return '.svg';
  if (type.includes('image/png')) return '.png';
  if (type.includes('image/jpeg')) return '.jpg';
  if (type.includes('image/gif')) return '.gif';
  return null;
}

function collectAssets(html) {
  const urls = new Set();
  for (const m of html.matchAll(/\/_next\/image\?url=([^"'\s]+?)(?:&amp;|&)w=\d+(?:(?:&amp;|&)q=\d+)?/g)) {
    try {
      const decoded = decodeAmp(decodeURIComponent(m[1]));
      if (/^https?:\/\//i.test(decoded)) urls.add(decoded);
    } catch {}
  }
  for (const m of html.matchAll(/https:\/\/firebasestorage\.googleapis\.com\/[^"'\s<>]+/g)) {
    urls.add(decodeAmp(m[0]));
  }
  return [...urls];
}

async function downloadAsset(url, localMap) {
  if (localMap.has(url)) return localMap.get(url);
  const hash = sha(url);
  if (existingAssets.has(hash)) {
    const local = `/mirror-assets/${existingAssets.get(hash)}`;
    localMap.set(url, local);
    return local;
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, referer: `${ORIGIN}/` },
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const ext = optimizeExtFromUrl(url) || extFromType(res.headers.get('content-type')) || '.bin';
      const file = `${hash}${ext}`;
      await fs.writeFile(path.join(ASSET_DIR, file), buffer);
      existingAssets.set(hash, file);
      const local = `/mirror-assets/${file}`;
      localMap.set(url, local);
      return local;
    } catch (err) {
      if (attempt === 2) {
        log('asset failed', url, String(err));
        return null;
      }
      await sleep(500 * (attempt + 1));
    }
  }
  return null;
}

function rewriteHtml(html, assetMap) {
  let out = stripScripts(html);

  out = out.replace(
    /\/_next\/image\?url=([^"'\s]+?)(?:&amp;|&)w=\d+(?:(?:&amp;|&)q=\d+)?/g,
    (match, encoded) => {
      try {
        const url = decodeAmp(decodeURIComponent(encoded));
        return assetMap.get(url) || url;
      } catch {
        return match;
      }
    },
  );

  out = out.replace(/https:\/\/firebasestorage\.googleapis\.com\/[^"'\s<>]+/g, (match) => {
    const url = decodeAmp(match);
    return assetMap.get(url) || match;
  });

  out = out.replace(/\s(?:srcSet|srcset|imageSrcSet|imagesrcset)="[^"]*"/g, '');
  out = out.replace(/(["'(])\/_next\//g, '$1/artsofoptics-com/_next/');
  out = out.replace(/https:\/\/artsofoptics\.com\/_next\//g, '/artsofoptics-com/_next/');
  out = out.replace(/(href|src)="\/3D-logo\.ico"/g, '$1="/artsofoptics-com/3D-logo.ico"');
  out = out.replace(/(href|src)="\/favicon\.ico"/g, '$1="/artsofoptics-com/favicon.ico"');
  out = out.replace(/href="https:\/\/artsofoptics\.com([^"]*)"/g, (match, p) => `href="${p || '/'}"`);

  return out;
}

function fileId(canonical) {
  return canonical
    .replace(/^\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function matchQuery(canonical) {
  const q = canonical.split('?')[1];
  if (!q) return '';
  const params = [...new URLSearchParams(q).entries()]
    .filter(([key]) => key !== 'page')
    .sort((a, b) => a[0].localeCompare(b[0]));
  return new URLSearchParams(params).toString();
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(ASSET_DIR, { recursive: true });
  await fs.mkdir(CACHE_DIR, { recursive: true });

  for (const name of await fs.readdir(ASSET_DIR)) {
    existingAssets.set(name.split('.')[0], name);
  }

  const seeds = [
    '/shop',
    '/shop?type_frame=Optical',
    '/shop?type_frame=Sunglasses',
    '/shop?gender=Female',
    '/shop?gender=Male',
    '/lenses/19',
    '/help/faq',
    '/help/track-order',
    '/about-us',
    '/contact-us',
    '/special-offers',
    '/ship-glasses',
    '/cart',
    '/profile',
    '/privacy-policy',
    '/refund-policy',
    '/shipping-policy',
    '/terms-of-service',
    ...Array.from({ length: 41 }, (_, i) => `/collection/${i + 1}`),
    ...(await readHomepageSeeds()),
  ];

  const queue = [];
  const seen = new Set();
  for (const seed of seeds) {
    const c = canonicalize(seed);
    if (c && !seen.has(c)) {
      seen.add(c);
      queue.push(c);
    }
  }

  log('seed urls:', queue.length);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    userDataDir: path.join(process.env.TEMP || ROOT, 'artsofoptics-mirror-profile'),
    args: ['--no-first-run', '--no-default-browser-check', '--disable-dev-shm-usage', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 1800 },
  });

  const pages = new Map();
  let cursor = 0;

  async function worker(id) {
    while (true) {
      const index = cursor++;
      if (index >= queue.length || pages.size >= MAX_PAGES) return;
      const canonical = queue[index];
      if (pages.has(canonical)) continue;
      const cacheFile = path.join(CACHE_DIR, `${fileId(canonical) || 'page'}.html`);
      if (fss.existsSync(cacheFile)) {
        const cachedHtml = await fs.readFile(cacheFile, 'utf8');
        pages.set(canonical, cachedHtml);
        for (const m of cachedHtml.matchAll(/href="([^"]+)"/g)) {
          const c = canonicalize(decodeAmp(m[1]));
          if (c && !seen.has(c) && queue.length < MAX_PAGES * 3) {
            seen.add(c);
            queue.push(c);
          }
        }
        log(`[w${id}] cache`, canonical);
        continue;
      }
      const url = ORIGIN + canonical;
      log(`[w${id}] render`, canonical);
      try {
        const { html, links } = await render(browser, url);
        pages.set(canonical, html);
        await fs.writeFile(cacheFile, html, 'utf8');
        for (const link of links) {
          const c = canonicalize(link);
          if (c && !seen.has(c) && queue.length < MAX_PAGES * 3) {
            seen.add(c);
            queue.push(c);
          }
        }
        log(`[w${id}] done`, canonical, `${links.length} links`);
      } catch (err) {
        log(`[w${id}] failed`, canonical, String(err));
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1)));
  await browser.close();
  log('rendered pages:', pages.size);

  const assetMap = new Map();
  const allAssets = new Set();
  for (const html of pages.values()) {
    for (const url of collectAssets(removeScripts(html))) allAssets.add(url);
  }
  log('unique assets:', allAssets.size);

  const assetList = [...allAssets];
  let assetCursor = 0;
  async function assetWorker() {
    while (true) {
      const index = assetCursor++;
      if (index >= assetList.length) return;
      await downloadAsset(assetList[index], assetMap);
      if (index % 25 === 0) log(`assets ${index}/${assetList.length}`);
    }
  }
  await Promise.all(Array.from({ length: 8 }, () => assetWorker()));
  log('downloaded assets:', assetMap.size, '/', allAssets.size);

  const manifest = [];
  for (const [canonical, html] of pages) {
    if (canonical === '/') continue;
    const cleaned = rewriteHtml(html, assetMap);
    const id = fileId(canonical) || 'page';
    const file = `${id}.html`;
    await fs.writeFile(path.join(OUT_DIR, file), cleaned, 'utf8');
    const qIndex = canonical.indexOf('?');
    manifest.push({
      url: canonical,
      pathname: qIndex === -1 ? canonical : canonical.slice(0, qIndex),
      search: qIndex === -1 ? '' : canonical.slice(qIndex + 1),
      match: matchQuery(canonical),
      file,
    });
    log('saved', file);
  }

  manifest.sort((a, b) => (b.match ? 1 : 0) - (a.match ? 1 : 0));
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');
  log('manifest entries:', manifest.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
