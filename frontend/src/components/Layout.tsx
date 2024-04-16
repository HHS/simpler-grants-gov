import { useTranslation } from "next-i18next";

import Footer from "./Footer";
import GrantsIdentifier from "./GrantsIdentifier";
import Header from "./Header";

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {

  const { t } = useTranslation("common");

  const title = t('Header.title');
  const nav_menu_toggle = t("nav_menu_toggle");
  const menuLinks = {
    nav_link_home: t("Header.nav_link_home"),
    nav_link_process: t("Header.nav_link_process"),
    nav_link_research:  t("Header.nav_link_research"),
    nav_link_newsletter: t("Header.nav_link_newsletter")
  }

  const link_twitter = t("Footer.link_twitter");

  return (
    // Stick the footer to the bottom of the page
    <div className="display-flex flex-column minh-viewport">
      <a className="usa-skipnav" href="#main-content">
        {t("skip_to_main")}
      </a>
      <Header title={title} nav_menu_toggle={nav_menu_toggle} menuLinks={menuLinks} />
      <main id="main-content">{children}</main>
      <Footer link_twitter={link_twitter} />
      <GrantsIdentifier />
    </div>
  );
};

export default Layout;
