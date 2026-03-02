const { defineConfig } = require("eslint/config");

const pluginJest = require("eslint-plugin-jest");
const testingLibrary = require("eslint-plugin-testing-library");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const js = require("@eslint/js");
const jestDomPlugin = require("eslint-plugin-jest-dom");

const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    // ignoring linting errors on storybook for now, will turn back on when we resume
    // active storybook development
    ignores: [
      "**/public/",
      "**/.storybook/",
      "**/.next/",
      "**/storybook-static",
      "next-env.d.ts",
    ],
  },
  {
    extends: compat.extends(
      "nava",
      "plugin:storybook/recommended",
      "prettier",
      "next/core-web-vitals",
    ),

    rules: {
      "@next/next/no-img-element": "off",

      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../"],
              message: "Relative imports are not allowed.",
            },
          ],
        },
      ],
    },

    settings: {
      next: {
        rootDir: __dirname,
      },
    },
  },
  {
    files: ["**/*.test.tsx"],
    plugins: {
      jest: pluginJest,
      "testing-library": testingLibrary,
      "jest-dom": jestDomPlugin,
    },
    languageOptions: {
      globals: pluginJest.environments.globals.globals,
    },
    rules: {
      ...pluginJest.configs.recommended.rules,
      ...testingLibrary.configs["flat/react"].rules,
      ...jestDomPlugin.configs["flat/recommended"].rules,
    },
  },
  {
    files: ["**/*.+(ts|tsx)"],

    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
      },
    },

    extends: compat.extends(
      "plugin:@typescript-eslint/recommended",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended-requiring-type-checking",
    ),

    plugins: {
      "@typescript-eslint": typescriptEslint,
    },

    rules: {
      camelcase: "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/no-explicit-any": "error",

      "no-console": [
        "error",
        {
          allow: ["warn", "error"],
        },
      ],

      "promise/catch-or-return": [
        "error",
        {
          allowFinally: true,
        },
      ],
    },
  },
]);
