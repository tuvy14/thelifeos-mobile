// Generates TheLifeOS monochrome "two-ring" brand icons from an inline SVG.
//
//   npm i -D sharp
//   node scripts/make-icons.mjs
//
// Overwrites the stock Expo art in assets/images/. Safe to re-run.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "assets", "images");
mkdirSync(out, { recursive: true });

const INK = "#fafafa";
const OBSIDIAN = "#0a0a0b";

/** TheLifeOS brand mark — the website's infinity-with-rings logo, centered.
 *  Source mark is viewBox 96×48; we scale + center it into a 1024 canvas. */
function rings({ bg = "none", ink = INK, scale = 1 } = {}) {
  const bgRect = bg === "none" ? "" : `<rect width="1024" height="1024" fill="${bg}"/>`;
  const markW = 96, markH = 48;
  const fit = (640 / markW) * scale; // mark spans ~62% of the canvas at scale 1
  const tx = (1024 - markW * fit) / 2;
  const ty = (1024 - markH * fit) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${bgRect}
    <g transform="translate(${tx},${ty}) scale(${fit})" fill="none" stroke="${ink}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M44 24C44 6 8 6 8 24C8 42 44 42 44 24C44 6 80 6 80 24C80 42 44 42 44 24"/>
      <circle cx="62" cy="24" r="10.5"/>
      <circle cx="62" cy="24" r="2.4" fill="${ink}"/>
    </g>
  </svg>`;
}

const solid = (color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${color}"/></svg>`;

async function png(svg, size, file) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(out, file));
  console.log("✓", file, `${size}×${size}`);
}

await png(rings({ bg: OBSIDIAN }), 1024, "icon.png");
await png(rings({ bg: "none" }), 512, "splash-icon.png");
await png(rings({ bg: OBSIDIAN }), 48, "favicon.png");
await png(rings({ bg: "none", scale: 0.62 }), 1024, "android-icon-foreground.png");
await png(solid(OBSIDIAN), 1024, "android-icon-background.png");
await png(rings({ bg: "none", ink: "#ffffff", scale: 0.62 }), 1024, "android-icon-monochrome.png");

console.log("\nDone. Icons written to assets/images/.");
