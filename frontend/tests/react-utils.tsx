/**
 * @file Exposes all of @testing-library/react, with one exception:
 * the exported render function is wrapped in a custom wrapper so
 * tests render within a global context that includes i18n content
 * @see https://testing-library.com/docs/react-testing-library/setup#custom-render
 */
import {
  render as _render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { defaultLocale, formats, timeZone } from "src/i18n/config";
import { messages } from "src/i18n/messages/en";

import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import React from "react";

const GlobalProviders = ({ children }: { children: React.ReactNode }) => {
  // IMPORTANT:
  // Our messages file includes arrays (e.g. iconSections/contentItems) that
  // some components consume via t.raw(...) and then .map().
  // Next-intl's AbstractIntlMessages typing doesn't allow arrays, so we cast,
  // but we MUST preserve runtime arrays to avoid crashes in tests.
  const intlMessages = messages as unknown as AbstractIntlMessages;

  return (
    <NextIntlClientProvider
      formats={formats}
      timeZone={timeZone}
      locale={defaultLocale}
      messages={intlMessages}
    >
      {children}
    </NextIntlClientProvider>
  );
};

// eslint-disable-next-line import/export
export * from "@testing-library/react";

// eslint-disable-next-line import/export
export function render(
  ui: React.ReactElement,
  options: Omit<RenderOptions, "wrapper"> = {},
): RenderResult {
  return _render(ui, { wrapper: GlobalProviders, ...options });
}
