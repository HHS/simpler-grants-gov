/**
 * Root layout component, wraps all pages.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/layout
 */
import { Metadata } from "next";

import Layout from "src/components/Layout";

export const metadata: Metadata = {
  icons: [`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/img/logo.svg`],
};

interface LayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default function RootLayout({ children, params }: LayoutProps) {
  return (
    <html lang={params.locale}>
      <body>
        {/* Separate layout component for the inner-body UI elements since Storybook
            and tests trip over the fact that this file renders an <html> tag */}
        <Layout locale={params.locale}>{children}</Layout>
      </body>
    </html>
  );
}