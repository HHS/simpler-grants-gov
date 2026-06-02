/**
 * Layout for all non form PDF / print pages
 */

import { Metadata } from "next";
import { environment } from "src/constants/environments";
import { LayoutProps } from "src/types/generalTypes";

import RootLayoutWrapper from "src/components/core/RootLayoutWrapper";
import Layout from "src/components/Layout";

export const metadata: Metadata = {
  icons: [`${environment.NEXT_PUBLIC_BASE_PATH}/img/favicon.ico`],
};

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  return (
    <RootLayoutWrapper params={params}>
      <Layout locale={locale}>{children}</Layout>
    </RootLayoutWrapper>
  );
}
