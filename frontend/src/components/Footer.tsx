import { useTranslation } from "next-i18next";
import {
  Address,
  Logo,
  SocialLink,
  SocialLinks,
  Footer as USWDSFooter,
} from "@trussworks/react-uswds";

const Footer = () => {
  const { t } = useTranslation("common", {
    keyPrefix: "Footer",
  });

  const links = [
    <SocialLink
      key="twitter"
      name="Twitter"
      href="https://twitter.com/grantsdotgov"
    />,
    <SocialLink
      key="youtube"
      name="YouTube"
      href="https://www.youtube.com/user/GrantsGovUS"
    />,
    <SocialLink
      key="rss"
      name="RSS"
      href="https://www.grants.gov/web/grants/rss.html"
    />,
  ];

  return (
    <USWDSFooter
      size="medium"
      primary={<div />}
      secondary={
        <div className="grid-row grid-gap">
          <Logo
            size="medium"
            image={
              <img
                className="usa-footer__logo-img"
                alt="img alt text"
                src={"/img/grants-gov-logo.png"}
              />
            }
            heading={
              <p className="usa-footer__logo-heading">{t("agency_name")}</p>
            }
          />
          <div className="usa-footer__contact-links mobile-lg:grid-col-6">
            <SocialLinks links={links} />
            <h3 className="usa-footer__contact-heading">
              {t("agency_contact_center")}
            </h3>
            <Address
              size="medium"
              items={[
                <a key="telephone" href={`tel:${t("telephone")}`}>
                  {t("telephone")}
                </a>,
                <a key="email" href={`mailto:${t("email")}`}>
                  {t("email")}
                </a>,
              ]}
            />
          </div>
        </div>
      }
    />
  );
};

export default Footer;
