// @ts-check
/**
 * Next.js i18n routing options
 * https://nextjs.org/docs/advanced-features/i18n-routing
 * @type {import('next').NextConfig['i18n']}
 */
const i18n = {
  defaultLocale: "en",
  // Source of truth for the list of languages supported by the application. Other tools (i18next, Storybook, tests) reference this.
  // These must be BCP47 language tags: https://en.wikipedia.org/wiki/IETF_language_tag#List_of_common_primary_language_subtags
  locales: ["en", "es"],
};

/**
 * i18next and react-i18next options
 * https://www.i18next.com/overview/configuration-options
 * https://react.i18next.com/latest/i18next-instance
 * @type {import("i18next").InitOptions}
 */
const i18next = {
  // Default namespace to load, typically overridden within components,
  // but set here to prevent the system from attempting to load
  // translation.json, which is the default, and doesn't exist
  // in this codebase
  ns: "common",
  defaultNS: "common",
  fallbackLng: i18n.defaultLocale,
  interpolation: {
    escapeValue: false, // React already does escaping
  },
};

/**
 * next-i18next options
 * https://github.com/i18next/next-i18next#options
 * @type {Partial<import("next-i18next").UserConfig>}
 */
const nextI18next = {
  // Locale resources are loaded once when the server is started, which
  // is good for production but not ideal for local development. Show
  // updates to locale files without having to restart the server:
  reloadOnPrerender: process.env.NODE_ENV === "development",
};

/**
 * @type {import("next-i18next").UserConfig}
 */
module.exports = {
  i18n,
  ...i18next,
  ...nextI18next,
};
