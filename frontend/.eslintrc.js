module.exports = {
  root: true,
  extends: [
    "nava",
    "plugin:storybook/recommended",
    // Disable ESLint code formatting rules which conflict with Prettier
    "prettier",
    // `next` should be extended last according to their docs
    // https://nextjs.org/docs/basic-features/eslint
    "next/core-web-vitals",
  ],
  // Additional lint rules. These get layered onto the top-level rules.
  overrides: [
    // Lint config specific to Test files
    {
      files: ["tests/**"],
      plugins: ["jest"],
      extends: [
        "plugin:jest/recommended",
        "plugin:jest-dom/recommended",
        "plugin:testing-library/react",
      ],
    },
    // Lint config specific to TypeScript files
    {
      files: "**/*.+(ts|tsx)",
      parserOptions: {
        // These paths need defined to support rules that require type information
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
      },
      extends: [
        "plugin:@typescript-eslint/recommended",
        // Disable vanilla ESLint rules that conflict with those in @typescript-eslint
        "plugin:@typescript-eslint/eslint-recommended",
        // Rules that specifically require type information
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
      plugins: ["@typescript-eslint"],
      rules: {
        // Prevent dead code accumulation
        "@typescript-eslint/no-unused-vars": "error",
        // The usage of `any` defeats the purpose of typescript. Consider using `unknown` type instead instead.
        "@typescript-eslint/no-explicit-any": "error",
      },
    },
  ],
  settings: {
    // Support projects where Next.js isn't installed in the root directory (such as a monorepo)
    next: {
      rootDir: __dirname,
    },
  },
};
