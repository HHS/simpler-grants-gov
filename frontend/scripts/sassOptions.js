// also used in storybook vite config
// // but can't be imported correctly there, figure out a better way to share this
const uswdsCssPaths = [
  "./node_modules/@uswds",
  "./node_modules/@uswds/uswds/packages",
];

/**
 * Configure Sass to load USWDS assets, and expose a Sass function for setting the
 * correct relative path to image or font assets, when the site is hosted from a subdirectory.
 */
function sassOptions() {
  return {
    includePaths: uswdsCssPaths,
  };
}

module.exports = sassOptions;
