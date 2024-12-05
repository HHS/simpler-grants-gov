/* eslint-disable @next/next/no-before-interactive-script-outside-document */
// the rule mentioned above seems to not take into account changes from the app router

/**
 * Root layout component, wraps all pages.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/layout
 */
import { GoogleAnalytics } from "@next/third-parties/google";
import * as newrelic from "newrelic";
import { Metadata } from "next";
import { environment } from "src/constants/environments";
import { locales } from "src/i18n/config";

import Script from "next/script";

import "src/styles/styles.scss";

interface Props {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

type NRType = typeof newrelic;

// see https://github.com/newrelic/node-newrelic/blob/40aea36320d15b201800431268be2c3d4c794a7b/api.js#L752
// types library does not expose a type for the options here, so building from scratch
interface typedGetBrowserTimingHeaderOptions {
  nonce?: string;
  hasToRemoveScriptWrapper?: boolean;
  allowTransactionlessInjection?: boolean; // tho jsdoc in nr code types this as "options"
}

interface NewRelicWithCorrectTypes extends NRType {
  agent: {
    collector: {
      isConnected: () => boolean;
    };
    on: (event: string, callback: (value: unknown) => void) => void;
  };
  getBrowserTimingHeader: (
    options?: typedGetBrowserTimingHeaderOptions,
  ) => string;
}
const typedNewRelic = newrelic as NewRelicWithCorrectTypes;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  icons: [`${environment.NEXT_PUBLIC_BASE_PATH}/img/favicon.ico`],
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;

  // see https://github.com/newrelic/newrelic-node-examples/blob/58f760e828c45d90391bda3f66764d4420ba4990/nextjs-app-router/app/layout.js
  if (typedNewRelic?.agent?.collector?.isConnected() === false) {
    await new Promise((resolve) => {
      typedNewRelic.agent.on("connected", resolve);
    });
  }

  const browserTimingHeader = typedNewRelic
    ? typedNewRelic.getBrowserTimingHeader({
        hasToRemoveScriptWrapper: true,
        allowTransactionlessInjection: true,
      })
    : "";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <GoogleAnalytics gaId={environment.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
        <Script
          id="nr-browser-agent"
          // By setting the strategy to "beforeInteractive" we guarantee that
          // the script will be added to the document's `head` element.
          // It turns out loading this anywhere else causes big problems with
          // consistency of loading the script.
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: browserTimingHeader }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
