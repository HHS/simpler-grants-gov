import React from "react";
import { messages } from "src/i18n/messages/en";


type MessagesTree = Record<string, any>;

let activeMessages: MessagesTree = messages as unknown as MessagesTree;

function getByDottedKey(tree: MessagesTree, dottedKey: string) {
  return dottedKey.split(".").reduce<any>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) return acc[part];
    return undefined;
  }, tree);
}

function formatIcuPlural(template: string, values?: Record<string, unknown>) {
  const m = template.match(
    /^\{(\w+),\s*plural,\s*=1\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}\s*\}$/,
  );
  if (!m) return null;

  const [, varName, oneForm, otherForm] = m;
  const rawCount = values?.[varName];
  const n = typeof rawCount === "number" ? rawCount : Number(rawCount);

  if (!Number.isFinite(n)) return template;

  const chosen = n === 1 ? oneForm : otherForm;
  return chosen.replace(/#/g, String(n));
}

function formatMessage(template: string, values?: Record<string, unknown>) {
  const plural = formatIcuPlural(template, values);
  if (plural !== null) return plural;

  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_m, key) => {
    const v = values[key];
    return v === null || v === undefined ? `{${key}}` : String(v);
  });
}

// Handles <Tag>content</Tag> where Tag maps to a function in values.
function renderRichMessage(
  message: string,
  values: Record<string, (chunks: React.ReactNode) => React.ReactNode>,
) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  const tagRe = /<([A-Za-z0-9_]+)>(.*?)<\/\1>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRe.exec(message))) {
    const [full, tagName, inner] = match;
    const start = match.index;

    if (start > lastIndex) parts.push(message.slice(lastIndex, start));

    const renderer = values?.[tagName];
    parts.push(renderer ? renderer(inner) : full);

    lastIndex = start + full.length;
  }

  if (lastIndex < message.length) parts.push(message.slice(lastIndex));

  return parts.length === 1
    ? parts[0]
    : React.createElement(React.Fragment, null, ...parts);
}

export function useMessages() {
  return activeMessages;
}

export function NextIntlClientProvider({ children, messages: providerMessages }: any) {
  if (providerMessages) activeMessages = providerMessages;
  return children;
}

export function useTranslations(namespace?: string) {
  const prefix = namespace ? `${namespace}.` : "";

  const t: any = (key: string, values?: Record<string, unknown>) => {
    const raw = getByDottedKey(activeMessages, `${prefix}${key}`);
    return typeof raw === "string"
      ? formatMessage(raw, values)
      : `${prefix}${key}`;
  };

  t.raw = (key: string) => getByDottedKey(activeMessages, `${prefix}${key}`);

  t.rich = (key: string, values: any) => {
    const raw = getByDottedKey(activeMessages, `${prefix}${key}`);
    if (typeof raw !== "string") return raw as any;

    const interpolated = formatMessage(raw, values);
    return renderRichMessage(interpolated, values ?? {});
  };

  return t;
}
