const { defineConfig } = require("eslint/config");

const pluginJest = require("eslint-plugin-jest");
const testingLibrary = require("eslint-plugin-testing-library");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const js = require("@eslint/js");
const jestDomPlugin = require("eslint-plugin-jest-dom");
const storybookPlugin = require("eslint-plugin-storybook");
const noLodash = require("eslint-plugin-you-dont-need-lodash-underscore");
const pretterPlugin = require("eslint-config-prettier/flat");
const nextPlugin = require("eslint-config-next/core-web-vitals");

// const { FlatCompat } = require("@eslint/eslintrc");

// const compat = new FlatCompat({
//   baseDirectory: __dirname,
//   recommendedConfig: js.configs.recommended,
//   allConfig: js.configs.all,
// });

module.exports = defineConfig([
  {
    ...js.configs.recommended,
    ...storybookPlugin.configs["flat/recommended"],
    ...noLodash.configs.compatible,
    ...pretterPlugin,
    ...nextPlugin,
    // ignoring linting errors on storybook for now, will turn back on when we resume
    // active storybook development
    ignores: [
      "**/public/",
      "**/.storybook/",
      "**/.next/",
      "**/storybook-static",
      "next-env.d.ts",
      "**/coverage/",
    ],
    // extends: compat.extends(
    //   "eslint:recommended",
    //   "plugin:storybook/recommended",
    //   "plugin:you-dont-need-lodash-underscore/compatible",
    //   "prettier",
    //   "next/core-web-vitals",
    // ),

    // extends: [
    //   "eslint:recommended",
    //   "plugin:storybook/recommended",
    //   "plugin:you-dont-need-lodash-underscore/compatible",
    //   "prettier",
    //   "next/core-web-vitals",
    // ],

    // extends: [
    //   js.configs.recommended,
    //   storybookPlugin.configs["flat/recommended"],
    //   noLodash.configs.compatible,
    //   pretterPlugin,
    //   nextPlugin,
    // ],
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
      // "react/react-in-jsx-scope": "off",
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
    ...typescriptEslint.configs.recommended,
    ...typescriptEslint.configs.recommendedTypeChecked,
    ...typescriptEslint.configs.stylisticTypeChecked,
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
      },
    },

    // extends: [
    //   typescriptEslint.configs.recommended,
    //   typescriptEslint.configs.recommendedTypeChecked,
    //   typescriptEslint.configs.stylisticTypeChecked,
    //   // "plugin:@typescript-eslint/recommended",
    //   // "plugin:@typescript-eslint/eslint-recommended",
    //   // "plugin:@typescript-eslint/recommended-requiring-type-checking",
    // ],

    plugins: {
      "@typescript-eslint": typescriptEslint,
    },

    rules: {
      camelcase: "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
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

      // typing a replacement function gets unnecessarily complex
      // see https://dev.to/tipsy_dev/advanced-typescript-reinventing-lodash-get-4fhe
      "you-dont-need-lodash-underscore/get": "off",
    },
  },
]);
