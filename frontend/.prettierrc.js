// @ts-check

/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */
module.exports = {
  /**
   * Sort imports so that the order is roughly:
   * - Built-in Node modules (`import ... from "fs"`)
   * - Third-party modules (`import ... from "lodash"`)
   * - Third-party modules that often export React components or hooks
   * - Local components
   * - All other files
   * @see https://github.com/IanVS/prettier-plugin-sort-imports
   */
  importOrder: [
    "<BUILTIN_MODULES>",
    "<THIRD_PARTY_MODULES>",
    "", // blank line
    "i18next",
    "^next[/-](.*)$",
    "^react$",
    "uswds",
    "", // blank line
    "^(src/)?components/(.*)$",
    "^[./]",
  ],
  importOrderTypeScriptVersion: "5.0.0",
};
