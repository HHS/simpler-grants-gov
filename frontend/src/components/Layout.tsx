import Footer from "./Footer";
import GrantsIdentifier from "./GrantsIdentifier";
import Header from "./Header";
import {
  useTranslations,
  useMessages,
  NextIntlClientProvider,
} from "next-intl";
import pick from "lodash/pick";

type Props = {
  children: React.ReactNode;
  locale: string;
};

export default function Layout({ children, locale }: Props) {
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
