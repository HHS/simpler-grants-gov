import "src/styles/styles.scss";
import { GoogleAnalytics } from "@next/third-parties/google";
import { PUBLIC_ENV } from "src/constants/environments";

import Layout from "src/components/Layout";
import { unstable_setRequestLocale } from "next-intl/server";
/**
 * Root layout component, wraps all pages.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/layout
 */
import { Metadata } from "next";

export const metadata: Metadata = {
  icons: [`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/img/favicon.ico`],
};

interface LayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default function RootLayout({ children, params }: LayoutProps) {
  // Hardcoded until the [locale] routing is enabled.
  const locale = params.locale ? params.locale : "en";
  // TODO: Remove when https://github.com/amannn/next-intl/issues/663 lands.
  unstable_setRequestLocale(locale);

  return (
    <html lang={locale}>
      <head>
        <GoogleAnalytics gaId={PUBLIC_ENV.GOOGLE_ANALYTICS_ID} />
      </head>
      <body>
        {/* Separate layout component for the inner-body UI elements since Storybook
            and tests trip over the fact that this file renders an <html> tag */}

        {/* TODO: Add locale="english" prop when ready for i18n */}
        <Layout locale={locale}>{children}</Layout>
      </body>
    </html>
  );
}
