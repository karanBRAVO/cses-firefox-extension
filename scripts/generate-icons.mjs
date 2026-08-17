import sharp from "sharp";
import path from "node:path";

const DIRNAME = import.meta.dirname;
const SIZES = [16, 32, 48, 96, 128];
const SOURCE = path.resolve(DIRNAME, "icon.svg");
const OUT_DIR = path.resolve(DIRNAME, "../public/icons");

for (const size of SIZES) {
  const outFile = path.join(OUT_DIR, `icon-${size}.png`);
  await sharp(SOURCE).resize(size, size).png().toFile(outFile);
  console.log(`wrote ${outFile}`);
}
