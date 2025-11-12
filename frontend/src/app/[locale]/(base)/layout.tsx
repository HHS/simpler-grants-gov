/**
 * Layout for all non form PDF / print pages
 */

import { Metadata } from "next";
import { environment } from "src/constants/environments";
import { LayoutProps } from "src/types/generalTypes";

import Layout from "src/components/Layout";
import { NavigationCacheBuster } from "src/components/NavigationCacheBuster";
import RootLayoutWrapper from "src/components/RootLayoutWrapper";

import "src/styles/styles.scss";

export const metadata: Metadata = {
  icons: [`${environment.NEXT_PUBLIC_BASE_PATH}/img/favicon.ico`],
};

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  return (
    <RootLayoutWrapper params={params}>
      <Layout locale={locale}>
        <NavigationCacheBuster />
        {children}
      </Layout>
    </RootLayoutWrapper>
  );
}
