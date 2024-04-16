import Footer from "./Footer";
import GrantsIdentifier from "./GrantsIdentifier";
import Header from "./Header";

type Props = {
  children: React.ReactNode;
  // TODO: pass locale into Layout when we setup i18n
  // locale?: string;
};

const Layout = ({ children }: Props) => {
  const title = 'Simpler.Grants.gov';
  const menuLinks = {
    nav_link_home: "Home",
    nav_link_process: "Process",
    nav_link_research:  "Research",
    nav_link_newsletter: "Newsletter",
  }



  return (
    // Stick the footer to the bottom of the page
    <div className="display-flex flex-column minh-viewport">
      <a className="usa-skipnav" href="#main-content">
        {"skip_to_main"}
      </a>
      <Header title={title} menuLinks={menuLinks}/>
      <main id="main-content">{children}</main>
      <Footer link_twitter="atf"/>
      <GrantsIdentifier />
    </div>
  );
};

export default Layout;
