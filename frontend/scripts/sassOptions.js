// @ts-check
const sass = require("sass");

/**
 * Configure Sass to load USWDS assets, and expose a Sass function for setting the
 * correct relative path to image or font assets, when the site is hosted from a subdirectory.
 */
function sassOptions(basePath = "") {
  return {
    includePaths: [
      "./node_modules/@uswds",
      "./node_modules/@uswds/uswds/packages",
    ],
    functions: {
      "add-base-path($path)": (path) => {
        return new sass.SassString(`${basePath}${path.getValue()}`);
      },
    },
  };
}

module.exports = sassOptions;
