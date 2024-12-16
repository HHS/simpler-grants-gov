import { merge } from "lodash";
import { defaultLocale, Locale } from "src/i18n/config";

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
  requestedLocale: Locale = defaultLocale,
) {
  let messages = await importMessages(requestedLocale);

  if (requestedLocale !== defaultLocale) {
    const fallbackMessages = await importMessages(defaultLocale);
    messages = merge({}, fallbackMessages, messages);
  }

  return messages;
}
