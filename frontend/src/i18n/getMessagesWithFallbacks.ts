import { merge } from "lodash";
import { defaultLocale, Locale, locales } from "src/i18n/config";

interface LocaleFile {
  messages: Messages;
}

async function importMessages(locale: Locale) {
  const { messages } = (await import(`./messages/${locale}`)) as LocaleFile;
  return messages;
}

/**
 * Get all messages for the given locale. If any translations are missing
 * from the current locale, the missing key will fallback to the default locale
 */
export async function getMessagesWithFallbacks(
  requestedLocale: string = defaultLocale,
) {
  const isValidLocale = locales.includes(requestedLocale as Locale); // https://github.com/microsoft/TypeScript/issues/26255
  if (!isValidLocale) {
    console.error(
      "Unsupported locale was requested. Falling back to the default locale.",
      { locale: requestedLocale, defaultLocale },
    );
    requestedLocale = defaultLocale;
  }

  const targetLocale = requestedLocale as Locale;
  let messages = await importMessages(targetLocale);

  if (targetLocale !== defaultLocale) {
    const fallbackMessages = await importMessages(defaultLocale);
    messages = merge({}, fallbackMessages, messages);
  }

  return messages;
}
