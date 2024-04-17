"use client";

import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
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

import logo from "../../public/img/logo-white-lg.webp";

// TODO: Remove during move to app router and next-intl upgrade
type IdentifierStrings = {
  link_about: string;
  link_accessibility: string;
  link_foia: string;
  link_fear: string;
  link_ig: string;
  link_performance: string;
  link_privacy: string;
  logo_alt: string;
};

type Props = {
  identifier_strings: IdentifierStrings;
};

const GrantsIdentifier = ({ identifier_strings }: Props) => {
  const { t } = useTranslation("common", {
    keyPrefix: "Identifier",
  });

  const logoImage = (
    <Image
      alt={identifier_strings.logo_alt}
      src={logo}
      className="usa-identifier__logo-img"
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
          <Trans
            t={t}
            i18nKey="identity"
            components={{
              hhsLink: <a href={ExternalRoutes.HHS} />,
            }}
          />
        </IdentifierIdentity>
      </IdentifierMasthead>
      <IdentifierLinks navProps={{ "aria-label": "Important links" }}>
        {IdentifierLinkList}
      </IdentifierLinks>
      <IdentifierGov aria-label="U.S. government information and services">
        <Trans
          t={t}
          i18nKey="gov_content"
          components={{
            usaLink: <a href={ExternalRoutes.USA} />,
          }}
        />
      </IdentifierGov>
    </Identifier>
  );
};

export default GrantsIdentifier;
