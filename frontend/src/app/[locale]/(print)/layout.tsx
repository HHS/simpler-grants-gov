/**
 * Root layout component, wraps all pages.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/layout
 */

import { Metadata } from "next";
import { environment } from "src/constants/environments";
import { LayoutProps } from "src/types/generalTypes";

import RootLayoutWrapper from "src/components/RootLayoutWrapper";

import "src/styles/styles.scss";

export const metadata: Metadata = {
  icons: [`${environment.NEXT_PUBLIC_BASE_PATH}/img/favicon.ico`],
};

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  return (
    <RootLayoutWrapper params={params}>
      <html lang={locale}>
        <body>{children}</body>
      </html>
    </RootLayoutWrapper>
  );
}
