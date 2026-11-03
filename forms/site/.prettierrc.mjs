/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */
export default {
  importOrder: [
    "<BUILTIN_MODULES>",
    "<THIRD_PARTY_MODULES>",
    "",
    "^(src/)?components/(.*)$",
    "^[./]",
  ],
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  importOrderTypeScriptVersion: "5.0.0",
};
