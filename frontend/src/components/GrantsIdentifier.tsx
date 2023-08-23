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

const GrantsIdentifier = () => {
  const { t } = useTranslation("common", {
    keyPrefix: "Identifier",
  });

  const logoImage = () => {
    return (
      <Image
        alt={t("logo_alt")}
        src={logo}
        className="usa-identifier__logo-img"
      />
    );
  };

  const IdentifierLinkList = [
    {
      href: ExternalRoutes.ABOUT_HHS,
      text: t("link_about"),
    },
    {
      href: ExternalRoutes.ACCESSIBILITY_COMPLIANCE,
      text: t("link_accessibility"),
    },
    {
      href: ExternalRoutes.FOIA,
      text: t("link_foia"),
    },
    {
      href: ExternalRoutes.NO_FEAR,
      text: t("link_fear"),
    },
    {
      href: ExternalRoutes.INSPECTOR_GENERAL,
      text: t("link_ig"),
    },
    {
      href: ExternalRoutes.PERFORMANCE_REPORTS,
      text: t("link_performance"),
    },
    {
      href: ExternalRoutes.PRIVACY_POLICY,
      text: t("link_privacy"),
    },
  ].map((link) => {
    return (
      <IdentifierLinkItem key={link.text}>
        <IdentifierLink
          target="_blank"
          rel="noopener noreferrer"
          href={link.href}
        >
          {link.text}
        </IdentifierLink>
      </IdentifierLinkItem>
    );
  });

  return (
    <Identifier data-testid="identifier">
      <IdentifierMasthead aria-label="Agency identifier">
        <IdentifierLogos>
          <IdentifierLogo href="#">{logoImage()}</IdentifierLogo>
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
