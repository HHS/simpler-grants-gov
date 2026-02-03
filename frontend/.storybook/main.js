// This file has been automatically migrated to valid ESM format by Storybook.
import { fileURLToPath } from "node:url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @file Storybook's main configuration file that controls the generation of Storybook.
 * Handles things like config for location of story files and managing presets (which configure webpack and babel).
 * @see https://storybook.js.org/docs/configurations/default-config/
 */
// @ts-check
// Support deploying to a subdirectory, such as GitHub Pages.
const NEXT_PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Most projects use Storybook for internal purposes, and partners may be
 * sensitive to the Storybook showing up in Google results.
 * @param {string} head
 * @returns string
 */
function blockSearchEnginesInHead(head) {
  return `
    ${head}
    <meta name="robots" content="none" />
  `;
}

/**
 * @type {import("@storybook/nextjs-vite").StorybookConfig}
 */
const config = {
  stories: ["../stories/**/*.@(mdx|stories.@(js|jsx|ts|tsx))"],
  addons: ["@chromatic-com/storybook", "@storybook/addon-docs"],

  framework: {
    name: "@storybook/nextjs-vite",
    options: {
      nextConfigPath: path.resolve(__dirname, "../next.config.js"),
      builder: {
        // Cache build output between runs, to speed up subsequent startup times
        fsCache: true,
        // lazyCompilation breaks Storybook when running from within Docker
        // Google Translate this page for context: https://zenn.dev/yutaosawa/scraps/7764e5f17173d1
        lazyCompilation: false,
      },
    },
  },

  core: {
    disableTelemetry: true,
  },

  staticDirs: ["../public"],

  // Support deploying Storybook to a subdirectory (like GitHub Pages).
  // This makes `process.env.NEXT_PUBLIC_BASE_PATH` available to our source code.
  env: (config) => ({
    ...config,
    NEXT_PUBLIC_BASE_PATH,
  }),

  managerHead: blockSearchEnginesInHead,

  docs: {},

  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
  async viteFinal(config) {
    // Merge custom configuration into the default config
    const { mergeConfig } = await import("vite");

    return mergeConfig(config, {
      css: {
        preprocessorOptions: {
          scss: {
            loadPaths: [
              "./node_modules/@uswds",
              "./node_modules/@uswds/uswds/packages",
            ],
          },
        },
      },
    });
  },
};
export default config;
