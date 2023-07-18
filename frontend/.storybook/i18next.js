// Configure i18next for Storybook
// See https://storybook.js.org/addons/storybook-react-i18next
import i18nConfig from "../next-i18next.config";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(Backend)
  .init({
    ...i18nConfig,
    backend: {
      loadPath: `${
        process.env.NEXT_PUBLIC_BASE_PATH ?? ""
      }/locales/{{lng}}/{{ns}}.json`,
    },
  });

export default i18next;
