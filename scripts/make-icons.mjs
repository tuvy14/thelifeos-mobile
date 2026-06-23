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

/** TheLifeOS brand mark — the website's two-overlapping-circles icon (icon.svg)
 *  with a soft glow, centered in a 1024 canvas. */
function rings({ bg = "none", ink = INK, scale = 1 } = {}) {
  const bgRect = bg === "none" ? "" : `<rect width="1024" height="1024" fill="${bg}"/>`;
  const cx = 512, cy = 512;
  const r = 176 * scale;   // 88 in the 512 source, doubled
  const gap = 112 * scale; // centers offset ±112 from middle
  const sw = 60 * scale;   // 30 in source, doubled
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${bgRect}
    <defs>
      <filter id="g" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="${14 * scale}" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g)" fill="none" stroke="${ink}" stroke-width="${sw}">
      <circle cx="${cx - gap}" cy="${cy}" r="${r}"/>
      <circle cx="${cx + gap}" cy="${cy}" r="${r}"/>
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
