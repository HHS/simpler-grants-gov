import Footer from "./Footer";
import GrantsIdentifier from "./GrantsIdentifier";
import Header from "./Header";

type Props = {
  children: React.ReactNode;
  // TODO: pass locale into Layout when we setup i18n
  // locale?: string;
};

const Layout = ({ children }: Props) => {
  // TODO: Remove during move to app router and next-intl upgrade
  const header_strings = {
    nav_link_home: "Home",
    nav_link_search: "Search",
    nav_link_process: "Process",
    nav_link_research: "Research",
    nav_link_newsletter: "Newsletter",
    nav_menu_toggle: "Menu",
    title: "Simpler.Grants.gov",
  };
  const footer_strings = {
    agency_name: "Grants.gov",
    agency_contact_center: "Grants.gov Program Management Office",
    telephone: "1-877-696-6775",
    return_to_top: "Return to top",
    link_twitter: "Twitter",
    link_youtube: "YouTube",
    link_github: "Github",
    link_rss: "RSS",
    link_newsletter: "Newsletter",
    link_blog: "Blog",
    logo_alt: "Grants.gov logo",
  };
  const identifier_strings = {
    identity:
      "An official website of the <hhsLink>U.S. Department of Health and Human Services</hhsLink>",
    gov_content:
      "Looking for U.S. government information and services? Visit <usaLink>USA.gov</usaLink>",
    link_about: "About HHS",
    link_accessibility: "Accessibility support",
    link_foia: "FOIA requests",
    link_fear: "EEO/No Fear Act",
    link_ig: "Office of the Inspector General",
    link_performance: "Performance reports",
    link_privacy: "Privacy Policy",
    logo_alt: "HHS logo",
  };
  const skip_to_main = "Skip to main content";
  return (
    // Stick the footer to the bottom of the page
    <div className="display-flex flex-column minh-viewport">
      <a className="usa-skipnav" href="#main-content">
        {skip_to_main}
      </a>
      <Header header_strings={header_strings} />
      <main id="main-content">{children}</main>
      <Footer footer_strings={footer_strings} />
      <GrantsIdentifier identifier_strings={identifier_strings} />
    </div>
  );
};

export default Layout;
