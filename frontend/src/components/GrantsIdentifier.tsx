import { ExternalRoutes } from "src/constants/routes";

import { useTranslations } from "next-intl";

import Image from "next/image";
import {
  Identifier,
  IdentifierGov,
  IdentifierIdentity,
  IdentifierLink,
  IdentifierLinkItem,
  IdentifierLinks,
  IdentifierLogo,
  IdentifierLogos,
  IdentifierMasthead,
} from "@trussworks/react-uswds";

import logo from "public/img/logo-white-lg.webp";

const GrantsIdentifier = () => {
  const t = useTranslations("Identifier");

  const identifier_strings = {
    link_about: t("link_about"),
    link_accessibility: t("link_accessibility"),
    link_foia: t("link_foia"),
    link_fear: t("link_fear"),
    link_ig: t("link_ig"),
    link_performance: t("link_performance"),
    link_privacy: t("link_privacy"),
    logo_alt: t("logo_alt"),
  };

  const logoImage = (
    <Image
      alt={identifier_strings.logo_alt}
      src={logo}
      className="usa-identifier__logo-img"
      width={500}
      height={168}
    />
  );

  const IdentifierLinkList = [
    {
      href: ExternalRoutes.ABOUT_HHS,
      text: identifier_strings.link_about,
    },
    {
      href: ExternalRoutes.ACCESSIBILITY_COMPLIANCE,
      text: identifier_strings.link_accessibility,
    },
    {
      href: ExternalRoutes.FOIA,
      text: identifier_strings.link_foia,
    },
    {
      href: ExternalRoutes.NO_FEAR,
      text: identifier_strings.link_fear,
    },
    {
      href: ExternalRoutes.INSPECTOR_GENERAL,
      text: identifier_strings.link_ig,
    },
    {
      href: ExternalRoutes.PERFORMANCE_REPORTS,
      text: identifier_strings.link_performance,
    },
    {
      href: ExternalRoutes.PRIVACY_POLICY,
      text: identifier_strings.link_privacy,
    },
  ].map(({ text, href }) => (
    <IdentifierLinkItem key={text}>
      <IdentifierLink target="_blank" rel="noopener noreferrer" href={href}>
        {text}
      </IdentifierLink>
    </IdentifierLinkItem>
  ));

  return (
    <Identifier data-testid="identifier">
      <IdentifierMasthead aria-label="Agency identifier">
        <IdentifierLogos>
          <IdentifierLogo href="#">{logoImage}</IdentifierLogo>
        </IdentifierLogos>
        <IdentifierIdentity domain="HHS.gov">
          {t.rich("identity", {
            hhsLink: (chunks) => <a href={ExternalRoutes.HHS}>{chunks}</a>,
          })}
        </IdentifierIdentity>
      </IdentifierMasthead>
      <IdentifierLinks navProps={{ "aria-label": "Important links" }}>
        {IdentifierLinkList}
      </IdentifierLinks>
      <IdentifierGov aria-label="U.S. government information and services">
        {t.rich("gov_content", {
          usaLink: (chunks) => <a href={ExternalRoutes.USA}>{chunks}</a>,
        })}
      </IdentifierGov>
    </Identifier>
  );
};

export default GrantsIdentifier;
