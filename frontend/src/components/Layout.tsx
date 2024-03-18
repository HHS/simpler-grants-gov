import { useTranslation } from "next-i18next";

import Footer from "./Footer";
import GrantsIdentifier from "./GrantsIdentifier";
import Header from "./Header";

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  const { t } = useTranslation("common", {
    keyPrefix: "Layout",
  });

  return (
    // Stick the footer to the bottom of the page
    <div className="display-flex flex-column minh-viewport">
      <a className="usa-skipnav" href="#main-content">
        {t("skip_to_main")}
      </a>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
      <GrantsIdentifier />
    </div>
  );
};

export default Layout;
