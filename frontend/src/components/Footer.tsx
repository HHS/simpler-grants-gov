import { ExternalRoutes } from "src/constants/routes";

import { useTranslation } from "next-i18next";
import { ComponentType } from "react";
import {
  Address,
  Grid,
  Icon,
  Logo,
  SocialLinks,
  Footer as USWDSFooter,
} from "@trussworks/react-uswds";
import { IconProps } from "@trussworks/react-uswds/lib/components/Icon/Icon";

// Recreate @trussworks/react-uswds SocialLinks component to accept any Icon
type SocialLinkProps = {
  href: string;
  name: string;
  Tag: ComponentType<IconProps>;
};

const SocialLink = ({ href, name, Tag }: SocialLinkProps) => (
  <a className="usa-social-link" href={href} title={name} target="_blank">
    <Tag className="usa-social-link__icon" name={name} aria-label={name} />
  </a>
);

const Footer = () => {
  const { t } = useTranslation("common", {
    keyPrefix: "Footer",
  });

  const links = [
    {
      href: ExternalRoutes.GRANTS_TWITTER,
      name: t("link_twitter"),
      Tag: Icon.Twitter,
    },
    {
      href: ExternalRoutes.GRANTS_YOUTUBE,
      name: t("link_youtube"),
      Tag: Icon.Youtube,
    },
    {
      href: ExternalRoutes.GITHUB_REPO,
      name: t("link_github"),
      Tag: Icon.Github,
    },
    {
      href: ExternalRoutes.GRANTS_RSS,
      name: t("link_rss"),
      Tag: Icon.RssFeed,
    },
    {
      href: ExternalRoutes.GRANTS_NEWSLETTER,
      name: t("link_newsletter"),
      Tag: Icon.Mail,
    },
    {
      href: ExternalRoutes.GRANTS_BLOG,
      name: t("link_blog"),
      Tag: Icon.LocalLibrary,
    },
  ].map(({ href, name, Tag }) => (
    <SocialLink
      href={href}
      key={name.toLocaleLowerCase()}
      name={name}
      Tag={Tag}
    />
  ));

  return (
    <USWDSFooter
      data-testid="footer"
      size="medium"
      primary={<div />}
      secondary={
        <Grid row>
          <Logo
            size="medium"
            image={
              <img
                className="usa-footer__logo-img"
                alt={t("logo_alt")}
                src={"/img/grants-gov-logo.png"}
              />
            }
            heading={
              <p className="usa-footer__logo-heading">{t("agency_name")}</p>
            }
          />
          <Grid className="usa-footer__contact-links" mobileLg={{ col: 6 }}>
            <SocialLinks links={links} />
            <h2 className="usa-footer__contact-heading">
              {t("agency_contact_center")}
            </h2>
            <Address
              size="medium"
              items={[
                <a key="telephone" href={`tel:${t("telephone")}`}>
                  {t("telephone")}
                </a>,
                <a key="email" href={ExternalRoutes.CONTACT_EMAIL}>
                  {t("email")}
                </a>,
              ]}
            />
          </Grid>
        </Grid>
      }
    />
  );
};

export default Footer;
