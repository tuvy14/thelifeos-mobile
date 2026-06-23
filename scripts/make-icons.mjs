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

/** Two concentric rings + core dot, centered in a 1024 canvas. */
function rings({ bg = "none", ink = INK, scale = 1 } = {}) {
  const c = 512;
  const bgRect = bg === "none" ? "" : `<rect width="1024" height="1024" fill="${bg}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${bgRect}
    <circle cx="${c}" cy="${c}" r="${340 * scale}" fill="none" stroke="${ink}" stroke-width="${40 * scale}"/>
    <circle cx="${c}" cy="${c}" r="${215 * scale}" fill="none" stroke="${ink}" stroke-width="${28 * scale}"/>
    <circle cx="${c}" cy="${c}" r="${58 * scale}" fill="${ink}"/>
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
