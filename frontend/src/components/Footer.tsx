import { useTranslation } from "next-i18next";
import {
  Address,
  FooterNav,
  Logo,
  SocialLinks,
  Footer as USWDSFooter,
} from "@trussworks/react-uswds";

const Footer = () => {
  const { t } = useTranslation("common", {
    keyPrefix: "Footer",
  });

  return (
    <USWDSFooter
      size="medium"
      primary={
        <div className="grid-row grid-gap">
          <Logo
            size="medium"
            image={
              <img
                className="usa-footer__logo-img"
                alt="img alt text"
                src={""}
              />
            }
            heading={<p className="usa-footer__logo-heading">Name of Agency</p>}
          />
          <div className="usa-footer__contact-links mobile-lg:grid-col-6">
            <SocialLinks links={[]} />
            <h3 className="usa-footer__contact-heading">
              Agency Contact Center
            </h3>
            <Address
              size="medium"
              items={[
                <a key="telephone" href="tel:1-800-555-5555">
                  (800) CALL-GOVT
                </a>,
                <a key="email" href="mailto:info@agency.gov">
                  info@agency.gov
                </a>,
              ]}
            />
          </div>
        </div>
      }
      secondary={[]}
    />
  );
};

export default Footer;
