import siteConfig from "./site/eslint.config.mjs";

export default [
  ...siteConfig,
  {
    files: ["scripts/**/*.mjs"],
    rules: {
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "no-unreachable": "error",
      "valid-typeof": "error",
      "no-constant-condition": "error",
    },
  },
  { ignores: ["**/node_modules/**", "**/dist/**", "**/.cache/**", "site/**"] },
];
