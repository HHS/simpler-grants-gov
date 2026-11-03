import { cpSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const uswdsDist = join(root, "node_modules", "@uswds", "uswds", "dist");
const publicUswds = join(root, "public", "uswds");

mkdirSync(join(publicUswds, "fonts"), { recursive: true });
mkdirSync(join(publicUswds, "img"), { recursive: true });

cpSync(join(uswdsDist, "fonts"), join(publicUswds, "fonts"), {
  recursive: true,
});
cpSync(join(uswdsDist, "img"), join(publicUswds, "img"), { recursive: true });
