import { GoogleAnalytics } from "@next/third-parties/google";
import * as newrelic from "newrelic";
/**
 * Root layout component, wraps all pages.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/layout
 */
import { Metadata } from "next";
import { environment } from "src/constants/environments";

import Script from "next/script";

import "src/styles/styles.scss";

import { NextIntlClientProvider } from "next-intl";
import { getMessages, unstable_setRequestLocale } from "next-intl/server";

import Layout from "src/components/Layout";

export const metadata: Metadata = {
  icons: [`${environment.NEXT_PUBLIC_BASE_PATH}/img/favicon.ico`],
};

interface Props {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

const locales = ["en", "es"];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;

  // Enable static rendering
  unstable_setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  if (newrelic.agent.collector.isConnected() === false) {
    await new Promise((resolve) => {
      newrelic.agent.on("connected", resolve);
    });
  }

  const browserTimingHeader = newrelic.getBrowserTimingHeader({
    hasToRemoveScriptWrapper: true,
    allowTransactionlessInjection: true,
  });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <GoogleAnalytics gaId={environment.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Layout locale={locale}>{children}</Layout>
        </NextIntlClientProvider>
        <Script
          // We have to set an id for inline scripts.
          // See https://nextjs.org/docs/app/building-your-application/optimizing/scripts#inline-scripts
          id="nr-browser-agent"
          // By setting the strategy to "beforeInteractive" we guarantee that
          // the script will be added to the document's `head` element.
          // However, we cannot add this because it needs to be in the Root Layout, outside of the [locale] directory
          // And we cannot add beneath the local directory because our HTML tag needs to know about the locale
          // Come back to this to see if we can find a solution later on
          // strategy="beforeInteractive"

          // The body of the script element comes from the async evaluation
          // of `getInitialProps`. We use the special
          // `dangerouslySetInnerHTML` to provide that element body. Since
          // it requires an object with an `__html` property, we pass in an
          // object literal.
          dangerouslySetInnerHTML={{ __html: browserTimingHeader }}
        />
      </body>
    </html>
  );
}
