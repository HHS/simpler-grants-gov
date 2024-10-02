import pick from "lodash/pick";

import {
  NextIntlClientProvider,
  useMessages,
  useTranslations,
} from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";

import Footer from "./Footer";
import GrantsIdentifier from "./GrantsIdentifier";
import Header from "./Header";

type Props = {
  children: React.ReactNode;
  locale: string;
};

export default function Layout({ children, locale }: Props) {
  unstable_setRequestLocale(locale);

  const t = useTranslations();
  const messages = useMessages();

  return (
    // Stick the footer to the bottom of the page
    <div className="display-flex flex-column minh-viewport">
      <a className="usa-skipnav" href="#main-content">
        {t("Layout.skip_to_main")}
      </a>
      <NextIntlClientProvider
        locale={locale}
        messages={pick(messages, "Header")}
      >
        <Header locale={locale} />
      </NextIntlClientProvider>
      <main id="main-content">{children}</main>
      <Footer />
      <GrantsIdentifier />
    </div>
  );
}
