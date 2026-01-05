import React from "react";
import { render, render as rtlRender, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { LocalizedPageProps } from "src/types/intl";
import { defaultLocale, formats, timeZone } from "src/i18n/config";
import { messages } from "src/i18n/messages/en";

export function makeLocalizedPageProps(locale: string = defaultLocale): LocalizedPageProps {
  return { params: Promise.resolve({ locale }) };
}

/**
 * Use this for App Router async pages (client pages) in Jest.
 */

export async function renderClientPage(
  Page: (props: LocalizedPageProps) => React.ReactElement | Promise<React.ReactElement>,
  locale: string = "en",
) {
  const ui = await Page(makeLocalizedPageProps(locale));
  return render(ui);
}

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
      // messages is the real EN bundle
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      messages={messages}
    >
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * Use this for App Router async pages (server pages) in Jest.
 */
export async function renderServerPage(
  Page: (props: LocalizedPageProps) => React.ReactElement | Promise<React.ReactElement>,
  {
    locale = defaultLocale,
    renderOptions,
  }: { locale?: string; renderOptions?: Omit<RenderOptions, "wrapper"> } = {},
) {
  const ui = await Page(makeLocalizedPageProps(locale));
  return rtlRender(ui, {
    wrapper: ({ children }) => <PageProviders locale={locale}>{children}</PageProviders>,
    ...renderOptions,
  });
}
