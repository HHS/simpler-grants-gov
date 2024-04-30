import "src/styles/styles.scss";

import Layout from "src/components/AppLayout";
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
  return (
    <html lang={locale}>
      <body>
        {/* Separate layout component for the inner-body UI elements since Storybook
            and tests trip over the fact that this file renders an <html> tag */}

        {/* TODO: Add locale="english" prop when ready for i18n */}
        <Layout locale={locale}>{children}</Layout>
      </body>
    </html>
  );
}
