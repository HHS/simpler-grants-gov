// @ts-check
import i18nConfig from "../next-i18next.config";

// Apply global styling to our stories
import "../src/styles/styles.scss";

// Import i18next config.
import i18n from "./i18next.js";

// Generate the options for the Language menu using the locale codes.
// Teams can override these labels, but this helps ensure that the language
// is at least exposed in the list.
const initialLocales = {};
i18nConfig.i18n.locales.forEach((locale) => (initialLocales[locale] = locale));

const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  // Configure i18next and locale/dropdown options.
  i18n,
};

/**
 * @type {import("@storybook/react").Preview}
 */
const preview = {
  parameters,
  globals: {
    locale: "en",
    locales: {
      ...initialLocales,
      en: "English",
      es: "Español",
    },
  },
};

export default preview;
