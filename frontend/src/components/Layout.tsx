import { useTranslation } from "next-i18next";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import Footer from "./Footer";
import Header from "./Header";
import Hero from "./Hero";

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
      <Hero />
      <main id="main-content" className="grid-col-fill">
        <GridContainer>
          <Grid row>
            <Grid col>{children}</Grid>
          </Grid>
        </GridContainer>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
