import GrantsLogo from "public/img/grants-gov-logo.png";
import { ExternalRoutes } from "src/constants/routes";

import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Address,
  Grid,
  GridContainer,
  SocialLinks,
  Footer as USWDSFooter,
} from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

// Recreate @trussworks/react-uswds SocialLink component to accept any Icon
// https://github.com/trussworks/react-uswds/blob/cf5b4555e25f0e52fc8af66afe29253922bed2a5/src/components/Footer/SocialLinks/SocialLinks.tsx#L33
type SocialLinkProps = {
  href: string;
  name: string;
  icon: string;
};

const SocialLink = ({ href, name, icon }: SocialLinkProps) => (
  <a className="usa-social-link" href={href} title={name} target="_blank">
    <USWDSIcon
      className="usa-icon usa-social-link__icon"
      height="40px"
      name={icon}
      aria-label={name}
    />
  </a>
);

const Footer = () => {
  const t = useTranslations("Footer");

  const links = [
    {
      href: ExternalRoutes.GRANTS_X_TWITTER,
      name: t("link_x_twitter"),
      icon: "x",
    },
    {
      href: ExternalRoutes.GRANTS_YOUTUBE,
      name: t("link_youtube"),
      icon: "youtube",
    },
    {
      href: ExternalRoutes.GRANTS_BLOG,
      name: t("link_blog"),
      icon: "local_library",
    },
    {
      href: ExternalRoutes.GRANTS_NEWSLETTER,
      name: t("link_newsletter"),
      icon: "mail",
    },
    {
      href: ExternalRoutes.GRANTS_RSS,
      name: t("link_rss"),
      icon: "rss_feed",
    },
    {
      href: ExternalRoutes.GITHUB_REPO,
      name: t("link_github"),
      icon: "github",
    },
  ].map(({ href, name, icon }) => (
    <SocialLink href={href} key={name} name={name} icon={icon} />
  ));

  return (
    <USWDSFooter
      data-testid="footer"
      size="medium"
      returnToTop={
        <GridContainer className="usa-footer__return-to-top margin-top-5">
          <a href="#">{t("return_to_top")}</a>
        </GridContainer>
      }
      primary={null}
      secondary={
        <Grid row gap>
          <Grid tablet={{ col: 4 }} desktop={{ col: 6 }}>
            <Image
              className="maxh-15 width-auto margin-bottom-2 tablet:margin-bottom-0"
              alt={t("logo_alt")}
              src={GrantsLogo}
              height={168}
              width={500}
              priority={false}
            />
          </Grid>
          <Grid
            className="usa-footer__contact-links"
            tablet={{ col: 8 }}
            desktop={{ col: 6 }}
          >
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
