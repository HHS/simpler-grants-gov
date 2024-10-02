import { GoogleAnalytics } from "@next/third-parties/google";
/**
 * Root layout component, wraps all pages.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/layout
 */
import { Metadata } from "next";
import { environment, PUBLIC_ENV } from "src/constants/environments";
import "src/styles/styles.scss";

import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, unstable_setRequestLocale } from "next-intl/server";

import Layout from "src/components/Layout";

export async function generateMetadata() {
  const t = await getTranslations({ locale: "en" });
  const meta: Metadata = {
    title: t("ErrorPages.page_not_found.title"),
    description: t("Index.meta_description"),
    icons: [`${environment.NEXT_PUBLIC_BASE_PATH}/img/favicon.ico`],
  };
  return meta;
}

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

  return (
    <html lang={locale}>
      <head>
        <GoogleAnalytics gaId={PUBLIC_ENV.GOOGLE_ANALYTICS_ID} />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Layout locale={locale}>{children}</Layout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
