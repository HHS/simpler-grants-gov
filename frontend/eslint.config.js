const {
    defineConfig,
} = require("eslint/config");

const jest = require("eslint-plugin-jest");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    extends: compat.extends("nava", "plugin:storybook/recommended", "prettier", "next/core-web-vitals"),

    rules: {
        "@next/next/no-img-element": "off",

        "no-restricted-imports": ["error", {
            patterns: [{
                group: ["../"],
                message: "Relative imports are not allowed.",
            }],
        }],
    },

    settings: {
        next: {
            rootDir: __dirname,
        },
    },
}, {
    files: ["tests/**/*.test.tsx"],

    plugins: {
        jest,
    },

    extends: compat.extends(
        "plugin:jest/recommended",
        "plugin:jest-dom/recommended",
        "plugin:testing-library/react",
    ),
}, {
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

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
        }],

        "@typescript-eslint/no-explicit-any": "error",

        "no-console": ["error", {
            allow: ["warn", "error"],
        }],

        "promise/catch-or-return": ["error", {
            allowFinally: true,
        }],
    },
}]);
