
import { GovBanner, Grid, GridContainer } from "@trussworks/react-uswds";

import AppFooter from "./AppFooter";
import GrantsIdentifier from "./AppGrantsIdentifier";
import Header from "./AppHeader";

type Props = {
  children: React.ReactNode;
  locale?: string;
};

const Layout = ({ children, locale }: Props) => {

  return (
    // Stick the footer to the bottom of the page
    <div className="display-flex flex-column minh-viewport">
      <a className="usa-skipnav" href="#main-content">
        {"skip_to_main"}
      </a>
      <Header />
      <main id="main-content">{children}</main>
      <AppFooter />
      <GrantsIdentifier />
    </div>
  );
};

export default Layout;