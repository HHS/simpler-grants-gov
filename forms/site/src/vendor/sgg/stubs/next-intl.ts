// Stand-in for `next-intl` when frontend components render outside Next: translations come
// straight from the frontend's English message bundle.
import { messages } from "@sgg/frontend/i18n/messages/en/index";

type Values = Record<string, string | number>;

const lookup = (path: string): unknown =>
  path
    .split(".")
    .reduce<unknown>(
      (node, key) => (node as Record<string, unknown> | undefined)?.[key],
      messages,
    );

const interpolate = (text: string, values?: Values) =>
  text.replace(/\{(\w+)\}/g, (match, name: string) =>
    values && name in values ? String(values[name]) : match,
  );

export const useTranslations = (namespace?: string) => {
  const t = (key: string, values?: Values) => {
    const found = lookup(namespace ? `${namespace}.${key}` : key);
    return typeof found === "string" ? interpolate(found, values) : key;
  };
  t.rich = t;
  t.raw = (key: string) => lookup(namespace ? `${namespace}.${key}` : key);
  t.has = (key: string) =>
    lookup(namespace ? `${namespace}.${key}` : key) !== undefined;
  return t;
};

export const useLocale = () => "en";
