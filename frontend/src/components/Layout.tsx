import { useTranslation } from "next-i18next";

import Footer from "./Footer";
import GrantsIdentifier from "./GrantsIdentifier";
import Header from "./Header";

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  const { t } = useTranslation("common");

  const header_strings = {
    title: t("Header.title"),
    nav_menu_toggle: t("nav_menu_toggle"),
    nav_link_home: t("Header.nav_link_home"),
    nav_link_process: t("Header.nav_link_process"),
    nav_link_research: t("Header.nav_link_research"),
    nav_link_newsletter: t("Header.nav_link_newsletter"),
  };

  const footer_strings = {
    agency_name: t("Footer.agency_name"),
    agency_contact_center: t("Footer.agency_contact_center"),
    telephone: t("Footer.telephone"),
    return_to_top: t("Footer.return_to_top"),
    link_twitter: t("Footer.link_twitter"),
    link_youtube: t("Footer.link_youtube"),
    link_blog: t("Footer.link_blog"),
    link_newsletter: t("Footer.link_newsletter"),
    link_rss: t("Footer.link_rss"),
    link_github: t("Footer.link_github"),
    logo_alt: t("Footer.logo_alt"),
  };

  const identifier_strings = {
    link_about: t("Identifier.link_about"),
    link_accessibility: t("Identifier.link_accessibility"),
    link_foia: t("Identifier.link_foia"),
    link_fear: t("Identifier.link_fear"),
    link_ig: t("Identifier.link_ig"),
    link_performance: t("Identifier.link_performance"),
    link_privacy: t("Identifier.link_privacy"),
    logo_alt: t("Identifier.logo_alt"),
  };

  return (
    // Stick the footer to the bottom of the page
    <div className="display-flex flex-column minh-viewport">
      <a className="usa-skipnav" href="#main-content">
        {t("Layout.skip_to_main")}
      </a>
      <Header header_strings={header_strings} />
      <main id="main-content">{children}</main>
      <Footer footer_strings={footer_strings} />
      <GrantsIdentifier identifier_strings={identifier_strings} />
    </div>
  );
};

export default Layout;
