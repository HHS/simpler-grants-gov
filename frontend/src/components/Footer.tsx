import { useTranslation } from "next-i18next";
import {
  Address,
  FooterNav,
  Grid,
  GridContainer,
  Footer as USWDSFooter,
} from "@trussworks/react-uswds";

const Footer = () => {
  const { t } = useTranslation("common", {
    keyPrefix: "Footer",
  });

  return (
    <USWDSFooter
      size="slim"
      returnToTop={
        <GridContainer className="usa-footer__return-to-top">
          <a href="#">{t("return_to_top")}</a>
        </GridContainer>
      }
      primary={
        <GridContainer className="usa-footer__primary-container">
          <Grid row>
            <Grid
              mobileLg={{
                col: 8,
              }}
            >
              <FooterNav
                aria-label="Footer navigation"
                size="medium"
                links={[
                  <a
                    key="nav_link_1"
                    href="#"
                    className="usa-footer__primary-link"
                  >
                    Nav link 1
                  </a>,
                  <a
                    key="nav_link_2"
                    href="#"
                    className="usa-footer__primary-link"
                  >
                    Nav link 2
                  </a>,
                ]}
              />
            </Grid>
            <Grid mobileLg={{ col: 4 }}>
              <Address
                size="slim"
                items={[
                  <a key="telephone" href="tel:1-800-555-5555">
                    (800) CALL-GOVT
                  </a>,
                  <a key="email" href="mailto:info@agency.gov">
                    info@agency.gov
                  </a>,
                ]}
              />
            </Grid>
          </Grid>
        </GridContainer>
      }
      secondary={<p className="usa-footer__logo-heading">{t("agency_name")}</p>}
    />
  );
};

export default Footer;
