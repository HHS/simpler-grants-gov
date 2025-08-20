import GrantsLogo from "public/img/grants-logo.svg";
import { ExternalRoutes } from "src/constants/routes";
import { messages } from "src/i18n/messages/en";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {
  Grid,
  GridContainer,
  Footer as USWDSFooter,
} from "@trussworks/react-uswds";

type FooterNavItems = typeof messages.Footer.links;

const FooterNavLinkItem = ({ to }: { to: keyof FooterNavItems }) => {
  const t = useTranslations("Footer");
  return (
    <li className="usa-footer__secondary-link margin-left-0">
      <Link href={`/${to}`}>{t(`links.${to}`)}</Link>
    </li>
  );
};

const Footer = () => {
  const t = useTranslations("Footer");

  return (
    <USWDSFooter
      data-testid="footer"
      size="medium"
      returnToTop={
        <GridContainer className="usa-footer__return-to-top margin-top-5">
          <a href="#">{t("returnToTop")}</a>
        </GridContainer>
      }
      primary={
        <GridContainer>
          <Grid row gap>
            <Grid tablet={{ col: 3 }}>
              <div className="footer-logo-container position-relative">
                <Image
                  className="height-auto position-relative"
                  alt={t("logoAlt")}
                  src={GrantsLogo as string}
                  unoptimized
                  fill
                />
              </div>
            </Grid>
            <Grid className="usa-footer__nav border-0" tablet={{ col: 3 }}>
              <h3>{t("explore")}</h3>
              <ul className="margin-top-3">
                <li className="usa-footer__secondary-link margin-left-0">
                  <Link href="/">{t("links.home")}</Link>
                </li>
                <FooterNavLinkItem to="search" />
                <FooterNavLinkItem to="vision" />
                <FooterNavLinkItem to="roadmap" />
                <FooterNavLinkItem to="events" />
                <FooterNavLinkItem to="subscribe" />
              </ul>
            </Grid>
            <Grid
              className="margin-top-3 tablet:margin-top-0"
              tablet={{ col: 3 }}
            >
              <h3>{t("simpler")}</h3>
              <div>
                {t.rich("feedback", {
                  email: (chunk) => (
                    <a href={`mailto:${ExternalRoutes.EMAIL_SIMPLERGRANTSGOV}`}>
                      {chunk}
                    </a>
                  ),
                })}
              </div>
              <h3>{t("supportCenter")}</h3>
              <div>
                {t.rich("techSupport", {
                  email: (chunk) => (
                    <a href={`mailto:${ExternalRoutes.EMAIL_SUPPORT}`}>
                      {chunk}
                    </a>
                  ),
                })}
              </div>
              <div className="margin-top-2">{t("telephone")}</div>
            </Grid>
            <Grid
              className="margin-top-3 tablet:margin-top-0"
              tablet={{ col: 3 }}
            >
              <h3 className="">{t("agencyContactCenter")}</h3>
              <div>
                {t.rich("grantorSupport", {
                  poc: (chunk) => (
                    <a
                      href={ExternalRoutes.GRANTOR_SUPPORT}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {chunk}
                    </a>
                  ),
                })}
              </div>
            </Grid>
          </Grid>
        </GridContainer>
      }
      secondary={null}
    />
  );
};

export default Footer;
