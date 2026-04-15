import path from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import nextVitals from "eslint-config-next/core-web-vitals";
import pluginJest from "eslint-plugin-jest";
import jestDomPlugin from "eslint-plugin-jest-dom";
import testingLibraryPlugin from "eslint-plugin-testing-library";
import { defineConfig } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  ...nextVitals,
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
      // \\"next/core-web-vitals",
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
      "react/react-in-jsx-scope": "off",
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
      "testing-library": testingLibraryPlugin,
      "jest-dom": jestDomPlugin,
    },
    languageOptions: {
      globals: pluginJest.environments.globals.globals,
    },
    rules: {
      ...pluginJest.configs.recommended.rules,
      ...testingLibraryPlugin.configs["flat/react"].rules,
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
