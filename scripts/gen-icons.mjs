// Generate PNG app icons from the serif-H monogram using sharp.
// Run: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");

// Standard icon: rounded black tile + white serif H, content centered.
const tile = (size, { maskable = false } = {}) => {
  // Maskable icons need the glyph inside a ~80% safe zone; standard can fill more.
  const radius = maskable ? 0 : Math.round(size * 0.22);
  const fontSize = Math.round(size * (maskable ? 0.5 : 0.62));
  const rx = radius ? `rx="${radius}" ry="${radius}"` : "";
  return Buffer.from(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
       <rect width="${size}" height="${size}" ${rx} fill="#1d1d1f"/>
       <text x="50%" y="52%" font-family="Georgia, 'Times New Roman', serif"
             font-size="${fontSize}" font-weight="600" fill="#ffffff"
             text-anchor="middle" dominant-baseline="central">H</text>
     </svg>`,
  );
};

const targets = [
  { file: "bookshop-icon-192.png", size: 192 },
  { file: "bookshop-icon-512.png", size: 512 },
  { file: "bookshop-icon-maskable-512.png", size: 512, maskable: true },
  { file: "bookshop-icon-180.png", size: 180 }, // apple-touch
  { file: "bookshop-icon-152.png", size: 152 }, // apple-touch (iPad)
  { file: "bookshop-icon-32.png", size: 32 },
  { file: "favicon-16.png", size: 16 },
];

await mkdir(publicDir, { recursive: true });

for (const t of targets) {
  const svg = tile(t.size, { maskable: t.maskable });
  await sharp(svg, { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toFile(resolve(publicDir, t.file));
  console.log(`✓ ${t.file} (${t.size}x${t.size}${t.maskable ? ", maskable" : ""})`);
}

console.log("Done.");
