/* Regenerates all app icons + the in-app brand mark from a single source image.
 * Source: assets/images/brandmark-source.png (white glowing infinity on black).
 * Run:    node scripts/gen-brand-icons.js
 *
 * It masks the AI-generator sparkle in the bottom-right corner, derives a
 * white-on-transparent logo (alpha = luminance) so the in-app mark can be tinted
 * per theme, and writes every size Expo needs. */
const sharp = require("sharp");

const DIR = "assets/images";
const SRC = `${DIR}/brandmark-source.png`;
const OBS = "#0a0a0b"; // app obsidian / icon background

(async () => {
  const meta = await sharp(SRC).metadata();
  const W = meta.width;
  const H = meta.height;

  // 1) Cover the bottom-right corner sparkle with a black patch, flatten on black.
  const pw = Math.round(W * 0.2);
  const ph = Math.round(H * 0.2);
  const patch = await sharp({
    create: { width: pw, height: ph, channels: 4, background: "#000000ff" },
  })
    .png()
    .toBuffer();
  const flat = await sharp(SRC)
    .flatten({ background: "#000000" })
    .composite([{ input: patch, top: H - ph, left: W - pw }])
    .toBuffer();

  // 2) White-on-transparent logo: use luminance as the alpha channel. The linear
  //    curve crushes the source's faint rectangular background glow to fully
  //    transparent while keeping the bright mark + its tight glow.
  const gray = await sharp(flat)
    .grayscale()
    .linear(1.85, -68)
    .toColourspace("b-w")
    .toBuffer();
  const whiteBase = await sharp({
    create: { width: W, height: H, channels: 3, background: "#ffffff" },
  })
    .png()
    .toBuffer();
  const logoT = await sharp(whiteBase).joinChannel(gray).png().toBuffer();

  // 3) Trim transparent border to the mark's bounding box for clean centering.
  const trimmed = await sharp(logoT).trim().toBuffer();
  const tm = await sharp(trimmed).metadata();

  // Place the trimmed mark centered on a square canvas.
  async function square(size, scale, flatten) {
    const target = Math.round(size * scale);
    const resized = await sharp(trimmed)
      .resize({ width: target, height: target, fit: "inside" })
      .toBuffer();
    const rm = await sharp(resized).metadata();
    let canvas = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: flatten ? OBS : "#00000000",
      },
    }).composite([
      {
        input: resized,
        top: Math.round((size - rm.height) / 2),
        left: Math.round((size - rm.width) / 2),
      },
    ]);
    if (flatten) canvas = canvas.flatten({ background: OBS });
    return canvas.png().toBuffer();
  }

  // iOS / store app icon — 1024², solid bg, NO alpha (Apple requirement).
  await sharp(await square(1024, 0.74, true)).removeAlpha().png().toFile(`${DIR}/icon.png`);

  // Web favicon.
  await sharp(await square(64, 0.82, true)).removeAlpha().png().toFile(`${DIR}/favicon.png`);

  // Splash mark — white-on-transparent (shown on the dark splash background).
  await sharp(trimmed).resize({ width: 512, height: 512, fit: "inside" }).png().toFile(`${DIR}/splash-icon.png`);

  // Android adaptive icon: padded foreground (safe zone) + solid bg + monochrome.
  await sharp(await square(1024, 0.56, false)).png().toFile(`${DIR}/android-icon-foreground.png`);
  await sharp({ create: { width: 1024, height: 1024, channels: 3, background: OBS } })
    .png()
    .toFile(`${DIR}/android-icon-background.png`);
  await sharp(await square(1024, 0.56, false)).png().toFile(`${DIR}/android-icon-monochrome.png`);

  // In-app brand mark — white-on-transparent, tinted per theme via the Logo component.
  await sharp(trimmed).resize({ width: 600, fit: "inside" }).png().toFile(`${DIR}/brandmark.png`);

  console.log(`DONE — source ${W}x${H}, trimmed ${tm.width}x${tm.height}`);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
