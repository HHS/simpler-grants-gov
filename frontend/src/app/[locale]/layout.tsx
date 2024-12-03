import { NextIntlClientProvider } from "next-intl";
import { getMessages, unstable_setRequestLocale } from "next-intl/server";

import Layout from "src/components/Layout";

interface Props {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;

  // Enable static rendering
  unstable_setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <body>
      <NextIntlClientProvider messages={messages}>
        <Layout locale={locale}>{children}</Layout>
      </NextIntlClientProvider>
    </body>
  );
}
