import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const ASSET_DIR = path.join(PUBLIC, 'mirror-assets');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const PLACEHOLDER = '/mirror-assets/placeholder.svg';
const URL_RE = /https?:\/\/[^"'\\\s<>]+/g;

const sha = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
const decodeAmp = (s) => s.replaceAll('&amp;', '&');
const existing = new Map();

function extFromUrl(url) {
  try {
    const m = new URL(url).pathname.match(/\.(png|jpe?g|webp|avif|svg|gif|mp4|webm)$/i);
    if (m) return `.${m[1].toLowerCase().replace('jpeg', 'jpg')}`;
  } catch {}
  return null;
}

function extFromType(type) {
  if (!type) return '';
  if (type.includes('image/webp')) return '.webp';
  if (type.includes('image/avif')) return '.avif';
  if (type.includes('image/svg')) return '.svg';
  if (type.includes('image/png')) return '.png';
  if (type.includes('image/jpeg')) return '.jpg';
  if (type.includes('image/gif')) return '.gif';
  if (type.includes('video/mp4')) return '.mp4';
  if (type.includes('video/webm')) return '.webm';
  return '';
}

function shouldLocalize(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'firebasestorage.googleapis.com') return true;
    if (u.hostname === 'artsofoptics.com' || u.hostname === 'www.artsofoptics.com') {
      return u.pathname.startsWith('/images/');
    }
    return /\.(png|jpe?g|webp|avif|svg|gif|mp4|webm)$/i.test(u.pathname);
  } catch {
    return false;
  }
}

async function loadExisting() {
  for (const name of await fs.readdir(ASSET_DIR)) {
    existing.set(name.split('.')[0], name);
  }
}

async function download(url) {
  const hash = sha(url);
  if (existing.has(hash)) return `/mirror-assets/${existing.get(hash)}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, referer: 'https://artsofoptics.com/' },
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const ext = extFromUrl(url) || extFromType(res.headers.get('content-type')) || '.bin';
      const file = `${hash}${ext}`;
      await fs.writeFile(path.join(ASSET_DIR, file), buffer);
      existing.set(hash, file);
      console.log('downloaded', file, url.slice(0, 110));
      return `/mirror-assets/${file}`;
    } catch (err) {
      if (attempt === 2) {
        console.log('failed', url.slice(0, 110), String(err));
        return null;
      }
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return null;
}

async function main() {
  await fs.mkdir(ASSET_DIR, { recursive: true });
  await loadExisting();

  const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><rect width="800" height="800" fill="#f0efed"/><text x="400" y="410" font-family="Georgia, serif" font-size="34" fill="#a8a29a" text-anchor="middle">JP</text></svg>`;
  await fs.writeFile(path.join(ASSET_DIR, 'placeholder.svg'), placeholder, 'utf8');

  const files = [
    path.join(ROOT, 'index.html'),
    path.join(PUBLIC, 'index.html'),
    ...(await fs.readdir(path.join(PUBLIC, 'mirror')))
      .filter((name) => name.endsWith('.html'))
      .map((name) => path.join(PUBLIC, 'mirror', name)),
  ];

  const raw = new Map();
  for (const file of files) raw.set(file, await fs.readFile(file, 'utf8'));

  const urls = new Set();
  for (const html of raw.values()) {
    for (const match of html.matchAll(URL_RE)) {
      if (shouldLocalize(match[0])) urls.add(decodeAmp(match[0]));
    }
  }
  console.log('assets to localize:', urls.size);

  const assetMap = new Map();
  const list = [...urls];
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= list.length) return;
      const url = list[index];
      const local = await download(url);
      assetMap.set(url, local || PLACEHOLDER);
      if (index % 20 === 0) console.log(`assets ${index}/${list.length}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, () => worker()));
  console.log('asset map:', assetMap.size);

  for (const [file, original] of raw) {
    let html = original;

    html = html.replace(
      /<img\b[^>]*\bsrc="https?:\/\/www\.facebook\.com\/tr[^"]*"[^>]*>/gi,
      '',
    );
    html = html.replace(
      /<iframe\b[^>]*\bsrc="https?:\/\/[^"]*"[^>]*>[\s\S]*?<\/iframe>/gi,
      '',
    );
    html = html.replace(/<iframe\b[^>]*\bsrc="https?:\/\/[^"]*"[^>]*\/?>/gi, '');
    html = html.replace(
      /<link\b[^>]*rel="(?:preconnect|dns-prefetch)"[^>]*>/gi,
      '',
    );
    html = html.replace(/<link\b[^>]*href="https?:\/\/[^"]*"[^>]*>/gi, '');

    html = html.replace(URL_RE, (rawUrl) => {
      const url = decodeAmp(rawUrl);
      return assetMap.get(url) || rawUrl;
    });

    html = html.replace(
      /https?:\/\/(?:www\.)?artsofoptics\.com(\/[^"'\s<>]*)?/gi,
      (match, rest) => rest || '/',
    );

    html = html.replace(
      /([A-Za-z0-9._%+-]+)@artsofoptics\.com/gi,
      '$1@jp.com',
    );

    html = html.replace(/Arts of Optics NYC/gi, 'JP');
    html = html.replace(/Arts of Optics/gi, 'JP');

    html = html.replace(/<a\b([^>]*)>/gi, (match, attrs) =>
      `<a${attrs.replace(/\s+href="https?:\/\/[^"]*"/i, '')}>`,
    );
    html = html.replace(/<form\b([^>]*)>/gi, (match, attrs) =>
      `<form${attrs
        .replace(/\s+action="https?:\/\/[^"]*"/i, '')
        .replace(/\s+formaction="https?:\/\/[^"]*"/i, '')}>`,
    );

    html = html.replace(
      /<link\b[^>]*rel="(?:shortcut icon|icon)"[^>]*>/gi,
      '<link rel="icon" type="image/svg+xml" href="/jp-favicon.svg">',
    );

    html = html.replaceAll('artsofoptics-com/', 'site-assets/');
    html = html.replaceAll('firebasestorage-googleapis-com/', 'media/');
    html = html.replaceAll('arts-of-optics-b919b.firebasestorage.app', 'site-bucket');
    html = html.replace(/arts-of-optics/gi, 'site');
    html = html.replace(/artsofoptics/gi, 'jp');

    await fs.writeFile(file, html, 'utf8');
  }

  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="6" fill="#141414"/><text x="32" y="43" font-family="Georgia, 'Times New Roman', serif" font-size="31" letter-spacing="1" fill="#ffffff" text-anchor="middle">JP</text></svg>`;
  await fs.writeFile(path.join(PUBLIC, 'jp-favicon.svg'), favicon, 'utf8');

  const moves = [
    ['artsofoptics-com', 'site-assets'],
    ['firebasestorage-googleapis-com', 'media'],
  ];
  for (const [from, to] of moves) {
    const source = path.join(PUBLIC, from);
    const target = path.join(PUBLIC, to);
    try {
      await fs.access(source);
      await fs.access(target).then(
        async () => {
          await fs.rm(target, { recursive: true, force: true });
          await fs.rename(source, target);
        },
        async () => {
          await fs.rename(source, target);
        },
      );
      console.log('renamed', from, '->', to);
    } catch {
      console.log('skip rename', from);
    }
  }

  const bucketOld = path.join(PUBLIC, 'media', 'v0', 'b', 'arts-of-optics-b919b.firebasestorage.app');
  const bucketNew = path.join(PUBLIC, 'media', 'v0', 'b', 'site-bucket');
  try {
    await fs.access(bucketOld);
    await fs.rename(bucketOld, bucketNew);
    console.log('renamed bucket');
  } catch {
    console.log('skip bucket rename');
  }

  console.log('done', files.length, 'html files');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
