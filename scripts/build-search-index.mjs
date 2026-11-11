import fs from "node:fs";
import path from "node:path";

const manifest = JSON.parse(fs.readFileSync("mirror-manifest.json", "utf8"));

const decode = (value) =>
  value
    .replace(/&#(x?)([0-9a-f]+);/gi, (_, hex, code) =>
      String.fromCodePoint(parseInt(code, hex ? 16 : 10)),
    )
    .replace(/&(amp|quot|apos|lt|gt|nbsp|rsquo|lsquo|ldquo|rdquo|ndash|mdash);/gi, (_, name) => {
      const entities = {
        amp: "&",
        quot: '"',
        apos: "'",
        lt: "<",
        gt: ">",
        nbsp: " ",
        rsquo: "\u2019",
        lsquo: "\u2018",
        ldquo: "\u201c",
        rdquo: "\u201d",
        ndash: "\u2013",
        mdash: "\u2014",
      };
      return entities[name.toLowerCase()] ?? _;
    });

const text = (value = "") =>
  decode(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

const readPage = (file) =>
  fs.readFileSync(path.join("public/mirror", file), "utf8");

const products = [];
const collections = [];

for (const entry of manifest) {
  const html = readPage(entry.file);
  const h1 = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]);
  const ogTitle = text(
    html.match(/property="og:title" content="([^"]*)"/)?.[1],
  );
  const image = html.match(/property="og:image" content="([^"]*)"/)?.[1] ?? "";
  const brand = text(
    html.match(/href="\/collection\/\d+"[^>]*>([^<]{1,80})</)?.[1],
  );

  if (entry.pathname.startsWith("/product/")) {
    const price =
      text(
        html.match(
          /<span class="text-\[19px\] text-black"[^>]*>([^<]+)<\/span>/,
        )?.[1],
      ) || "";
    const title = ogTitle.replace(/\s*\|\s*JP\s*$/i, "");
    const type = /sunglasses/i.test(title)
      ? "Sunglasses"
      : /eyeglasses|optical/i.test(title)
        ? "Eyeglasses"
        : "Eyewear";

    products.push({
      name: h1 || title,
      brand: brand || h1.split(" ")[0] || "",
      type,
      price,
      image,
      url: entry.url,
      search: `${title} ${h1} ${brand} ${type}`.toLowerCase(),
    });
  } else if (entry.pathname.startsWith("/collection/")) {
    const name = h1 || text(ogTitle.replace(/\s*\|\s*JP\s*$/i, ""));
    collections.push({
      name,
      brand: "Collection",
      type: "Brand",
      price: "",
      image,
      url: entry.url,
      search: `${name} ${ogTitle} collection brand`.toLowerCase(),
    });
  }
}

const data = {
  generatedAt: new Date().toISOString(),
  products,
  collections,
};

fs.writeFileSync(
  "public/search-index.json",
  JSON.stringify(data, null, 0),
  "utf8",
);

console.log(
  `search index: ${products.length} products, ${collections.length} collections`,
);
