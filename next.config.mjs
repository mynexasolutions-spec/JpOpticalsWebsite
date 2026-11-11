import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  async rewrites() {
    const mirrorRewrites = [];

    try {
      const manifestPath = fileURLToPath(new URL('./mirror-manifest.json', import.meta.url));
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const withQuery = [];
        const plain = [];

        for (const page of manifest) {
          const destination = `/mirror/${page.file}`;
          if (page.match) {
            const has = [...new URLSearchParams(page.match).entries()].map(([key, value]) => ({
              type: 'query',
              key,
              value,
            }));
            withQuery.push({ source: page.pathname, has, destination });
          } else {
            plain.push({ source: page.pathname, destination });
          }
        }

        mirrorRewrites.push(...withQuery, ...plain);
      }
    } catch {
      // ignore a missing or malformed mirror manifest
    }

    return {
      beforeFiles: [{ source: '/', destination: '/index.html' }, ...mirrorRewrites],
    };
  },
};

export default nextConfig;
