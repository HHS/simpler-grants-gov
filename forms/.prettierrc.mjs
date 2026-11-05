/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */
export default {
  importOrder: [
    "<BUILTIN_MODULES>",
    "<THIRD_PARTY_MODULES>",
    "",
    "^(src/)?components/(.*)$",
    "^[./]",
  ],
  plugins: ["prettier-plugin-astro", "@ianvs/prettier-plugin-sort-imports"],
  overrides: [{ files: "*.astro", options: { parser: "astro" } }],
  importOrderTypeScriptVersion: "5.0.0",
};
