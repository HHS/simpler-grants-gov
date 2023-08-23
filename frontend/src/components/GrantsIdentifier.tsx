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
        height={48}
        width={48}
        style={{
          width: "48px",
          height: "48px",
        }}
      />
    );
  };

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
        <IdentifierLinkItem key="one">
          <IdentifierLink href={ExternalRoutes.ABOUT_HHS}>
            {t("link_about")}
          </IdentifierLink>
        </IdentifierLinkItem>
        <IdentifierLinkItem key="two">
          <IdentifierLink href={ExternalRoutes.ACCESSIBILITY_COMPLIANCE}>
            {t("link_accessibility")}
          </IdentifierLink>
        </IdentifierLinkItem>
        <IdentifierLinkItem key="three">
          <IdentifierLink href={ExternalRoutes.FOIA}>
            {t("link_foia")}
          </IdentifierLink>
        </IdentifierLinkItem>
        <IdentifierLinkItem key="four">
          <IdentifierLink href={ExternalRoutes.NO_FEAR}>
            {t("link_fear")}
          </IdentifierLink>
        </IdentifierLinkItem>
        <IdentifierLinkItem key="five">
          <IdentifierLink href={ExternalRoutes.INSPECTOR_GENERAL}>
            {t("link_ig")}
          </IdentifierLink>
        </IdentifierLinkItem>
        <IdentifierLinkItem key="six">
          <IdentifierLink href={ExternalRoutes.PERFORMANCE_REPORTS}>
            {t("link_performance")}
          </IdentifierLink>
        </IdentifierLinkItem>
        <IdentifierLinkItem key="seven">
          <IdentifierLink href={ExternalRoutes.PRIVACY_POLICY}>
            {t("link_privacy")}
          </IdentifierLink>
        </IdentifierLinkItem>
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
