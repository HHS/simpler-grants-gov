import { messages as En } from "src/i18n/messages/en/index";
import { messages as Es } from "src/i18n/messages/es/index";

type Messages = {
  [key: string]: string | object | Messages | Array<string | Messages>;
};

export function getMessagesSync(locale: string): Messages {
  switch (locale) {
    case "en":
      return En as Messages;
    case "es":
      return Es as Messages;
    default:
      return En as Messages;
  }
}

type GetTranslationsSync = {
  nameSpace: string;
  locale?: string;
  translateAbleString: string;
};

// NOTE: does not support t.rich or other features
export const getSimpleTranslationsSync = ({
  nameSpace,
  locale = "en",
  translateableString,
}: GetTranslationsSync) => {
  const messages = getMessagesSync(locale);
  const namespacedMessages = messages[nameSpace] as Messages;
  if (typeof namespacedMessages === "object" && namespacedMessages !== null) {
    const value = namespacedMessages[translateAbleString];
    return typeof value === "string" ? value : translateAbleString;
  } else {
    return translateAbleString;
  }
};
