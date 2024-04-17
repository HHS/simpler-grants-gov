"use client";

import { ExternalRoutes } from "src/constants/routes";
import { assetPath } from "src/utils/assetPath";

import { ComponentType } from "react";
import {
  Address,
  Grid,
  GridContainer,
  Icon,
  SocialLinks,
  Footer as USWDSFooter,
} from "@trussworks/react-uswds";
import { IconProps } from "@trussworks/react-uswds/lib/components/Icon/Icon";

// Recreate @trussworks/react-uswds SocialLink component to accept any Icon
// https://github.com/trussworks/react-uswds/blob/cf5b4555e25f0e52fc8af66afe29253922bed2a5/src/components/Footer/SocialLinks/SocialLinks.tsx#L33
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

type FooterStrings = {
  agency_name: string
  agency_contact_center: string,
  telephone: string,
  return_to_top: string,
  link_twitter: string,
  link_youtube: string,
  link_blog: string,
  link_newsletter: string,
  link_rss: string,
  link_github: string,
  logo_alt: string,
}

type Props = {
  footer_strings: FooterStrings;
};

const Footer = ({ footer_strings }: Props) => {

  const links = [
    {
      href: ExternalRoutes.GRANTS_TWITTER,
      name: footer_strings.link_twitter,
      Tag: Icon.Twitter,
    },
    {
      href: ExternalRoutes.GRANTS_YOUTUBE,
      name: footer_strings.link_youtube,
      Tag: Icon.Youtube,
    },
    {
      href: ExternalRoutes.GRANTS_BLOG,
      name: footer_strings.link_blog,
      Tag: Icon.LocalLibrary,
    },
    {
      href: ExternalRoutes.GRANTS_NEWSLETTER,
      name: footer_strings.link_newsletter,
      Tag: Icon.Mail,
    },
    {
      href: ExternalRoutes.GRANTS_RSS,
      name: footer_strings.link_rss,
      Tag: Icon.RssFeed,
    },
    {
      href: ExternalRoutes.GITHUB_REPO,
      name: footer_strings.link_github,
      Tag: Icon.Github,
    },
  ].map(({ href, name, Tag }) => (
    <SocialLink
      href={href}
      key={name}
      name={name}
      Tag={Tag}
    />
  ));

  return (
    <USWDSFooter
      data-testid="footer"
      size="medium"
      returnToTop={
        <GridContainer className="usa-footer__return-to-top margin-top-5">
          <a href="#">{footer_strings.return_to_top}</a>
        </GridContainer>
      }
      primary={null}
      secondary={
        <Grid row gap>
          <Grid tablet={{ col: 4 }} desktop={{ col: 6 }}>
            <img
              className="maxh-15 margin-bottom-2 tablet:margin-bottom-0"
              alt={footer_strings.logo_alt}
              src={assetPath("/img/grants-gov-logo.png")}
            />
          </Grid>
          <Grid
            className="usa-footer__contact-links"
            tablet={{ col: 8 }}
            desktop={{ col: 6 }}
          >
            <SocialLinks links={links} />
            <h2 className="usa-footer__contact-heading">
              {footer_strings.agency_contact_center}
            </h2>
            <Address
              size="medium"
              items={[
                <a key="telephone" href={`tel:${footer_strings.telephone}`}>
                  {footer_strings.telephone}
                </a>,
                <a key="email" href={`mailto:${ExternalRoutes.EMAIL_SUPPORT}`}>
                  {ExternalRoutes.EMAIL_SUPPORT}
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
