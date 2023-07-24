/**
 * Storybook needs this for adding vendor prefixes like Next.js
 * does out of the box.
 * https://github.com/storybookjs/storybook/issues/23234
 */
module.exports = {
  plugins: {
    autoprefixer: {},
  },
};
