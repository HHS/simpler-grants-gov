/**
 * Postinstall script that copies the USWDS assets to the public folder,
 * so that the static assets, like images, can be loaded by the browser.
 * This runs after `npm install`
 */
// @ts-check
const fs = require("fs");
const path = require("path");

const uswdsPath = path.resolve(__dirname, "../node_modules/@uswds/uswds/dist");
const publicPath = path.resolve(__dirname, "../public/uswds");

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }
  fs.readdirSync(src).forEach((file) => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

console.log("Copying USWDS assets from", uswdsPath, "to", publicPath);
copyDir(uswdsPath, publicPath);
console.log("Copied USWDS assets");
