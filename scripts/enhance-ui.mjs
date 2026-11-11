import fs from "node:fs";
import path from "node:path";

const files = [
  "public/index.html",
  ...fs
    .readdirSync("public/mirror")
    .filter((name) => name.endsWith(".html"))
    .map((name) => path.join("public/mirror", name)),
];

const styleTag = '<link rel="stylesheet" href="/jp-ui.css">';
const scriptTag = '<script defer src="/jp-ui.js"></script>';
const aboutHeroSection =
  '<main><section class="relative w-full h-[62vh] min-h-[420px] bg-[#0e0e0e] overflow-hidden flex items-center justify-center">';
const aboutHeroMedia =
  '<picture class="jp-about-hero-media"><source media="(max-width: 767px)" srcset="/mirror-assets/about-hero-cartier-mobile.webp"><img src="/mirror-assets/about-hero-cartier.webp" alt="Model wearing Cartier eyewear in a warm editorial portrait" fetchpriority="high" decoding="async"></picture><div class="jp-about-hero-scrim"></div>';
let changed = 0;

for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  const original = html;

  if (
    file.endsWith("about-us.html") &&
    html.includes(aboutHeroSection) &&
    !html.includes("jp-about-hero-media")
  ) {
    html = html.replace(aboutHeroSection, aboutHeroSection + aboutHeroMedia);
  }

  html = html
    .replace(/\s*<link[^>]+href="\/jp-ui\.css"[^>]*>/g, "")
    .replace(/\s*<script[^>]+src="\/jp-ui\.js"[^>]*><\/script>/g, "");

  html = html.replace(
    /\b(src|href|poster)="(media|site-assets)\//g,
    '$1="/$2/',
  );

  const socialLinks = {
    Facebook: "https://www.facebook.com/jp.shop",
    X: "https://x.com/jp",
    Instagram: "https://www.instagram.com/jp_shop/",
    YouTube: "https://www.youtube.com/@jp",
    TikTok: "https://www.tiktok.com/@jp",
  };
  html = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (match, attrs, content) => {
    const label = attrs.match(/aria-label="([^"]+)"/i)?.[1];
    if (label && socialLinks[label] && !/\bhref="/i.test(attrs)) {
      return `<a href="${socialLinks[label]}"${attrs}>${content}</a>`;
    }
    if (/Powered by DevInsidercode/i.test(content) && !/\bhref="/i.test(attrs)) {
      return `<a href="https://devinsidercode.com/"${attrs}>${content}</a>`;
    }
    return match;
  });

  const headEnd = html.indexOf("</head>");
  if (headEnd === -1) {
    console.warn(`skipped (no </head>): ${file}`);
    continue;
  }

  html =
    html.slice(0, headEnd) +
    styleTag +
    scriptTag +
    html.slice(headEnd);

  if (html !== original) {
    fs.writeFileSync(file, html, "utf8");
    changed += 1;
  }
}

console.log(`enhanced ${changed} of ${files.length} pages`);
