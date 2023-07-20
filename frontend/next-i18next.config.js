/**
 * Next.js i18n routing options
 * https://nextjs.org/docs/advanced-features/i18n-routing
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
 */
const i18next = {
  defaultNS: "common",
  fallbackLng: i18n.defaultLocale,
  interpolation: {
    escapeValue: false, // React already does escaping
  },
};

/**
 * next-i18next options
 * https://github.com/i18next/next-i18next#options
 */
const nextI18next = {
  // Locale resources are loaded once when the server is started, which
  // is good for production but not ideal for local development. Show
  // updates to locale files without having to restart the server:
  reloadOnPrerender: process.env.NODE_ENV === "development",
};

module.exports = {
  i18n,
  ...i18next,
  ...nextI18next,
};
