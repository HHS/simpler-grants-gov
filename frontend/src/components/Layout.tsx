import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import Footer from "./Footer";
import GrantsIdentifier from "./GrantsIdentifier";
import Header from "./Header";

type Props = {
  children: React.ReactNode;
  locale: string;
};

export default function Layout({ children, locale }: Props) {
  setRequestLocale(locale);

  const t = useTranslations();

  return (
    // Stick the footer to the bottom of the page
    <div className="display-flex flex-column minh-viewport">
      <a className="usa-skipnav z-top" href="#main-content">
        {t("Layout.skip_to_main")}
      </a>
      <Header locale={locale} />
      <main id="main-content" className="border-top-0">
        {children}
      </main>
      <Footer />
      <GrantsIdentifier />
    </div>
  );
}
