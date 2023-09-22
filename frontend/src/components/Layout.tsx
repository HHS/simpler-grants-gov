import { useTranslation } from "next-export-i18n";

import Footer from "./Footer";
import Header from "./Header";

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  const { t } = useTranslation();

  return (
    // Stick the footer to the bottom of the page
    <div className="display-flex flex-column minh-viewport">
      <a className="usa-skipnav" href="#main-content">
        {t("Layout.skip_to_main")}
      </a>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
