import {
  render as rtlRender,
  type RenderOptions,
} from "@testing-library/react";
import { defaultLocale, formats, timeZone } from "src/i18n/config";
import { messages } from "src/i18n/messages/en";
import type { LocalizedPageProps } from "src/types/intl";

import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import React from "react";

export function makeLocalizedPageProps(
  locale: string = defaultLocale,
): LocalizedPageProps {
  return { params: Promise.resolve({ locale }) };
}

/**
 * Wrapper for App Router pages (server/client) that need NextIntlClientProvider.
 */
function PageProviders({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider
      formats={formats}
      timeZone={timeZone}
      locale={locale}
      messages={messages as unknown as AbstractIntlMessages}
    >
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * Use this for App Router pages (sync or async) that are client-renderable in Jest.
 */
export async function renderClientPage(
  Page: (
    props: LocalizedPageProps,
  ) => React.ReactElement | Promise<React.ReactElement>,
  { locale = defaultLocale }: { locale?: string } = {},
) {
  const ui = await Page(makeLocalizedPageProps(locale));
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <PageProviders locale={locale}>{children}</PageProviders>
    ),
  });
}

/**
 * Use this for App Router server pages in Jest.
 * (Same as renderClientPage for now, but separated for clarity / future needs.)
 */
export async function renderServerPage(
  Page: (
    props: LocalizedPageProps,
  ) => React.ReactElement | Promise<React.ReactElement>,
  {
    locale = defaultLocale,
    renderOptions,
  }: { locale?: string; renderOptions?: Omit<RenderOptions, "wrapper"> } = {},
) {
  const ui = await Page(makeLocalizedPageProps(locale));
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <PageProviders locale={locale}>{children}</PageProviders>
    ),
    ...renderOptions,
  });
}
