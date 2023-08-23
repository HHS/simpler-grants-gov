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
              hhsLink: <a href="https://www.hhs.gov" />,
            }}
          />
        </IdentifierIdentity>
      </IdentifierMasthead>
      <IdentifierLinks navProps={{ "aria-label": "Important links" }}>
        <IdentifierLinkItem key="one">
          <IdentifierLink href="https://www.hhs.gov/about/index.html">
            {t("link_about")}
          </IdentifierLink>
        </IdentifierLinkItem>
        <IdentifierLinkItem key="two">
          <IdentifierLink
            href="https://www.grants.gov/web/grants/accessibility-compliance.html
"
          >
            {t("link_accessibility")}
          </IdentifierLink>
        </IdentifierLinkItem>
        <IdentifierLinkItem key="three">
          <IdentifierLink href="https://www.hhs.gov/foia/index.html">
            {t("link_foia")}
          </IdentifierLink>
        </IdentifierLinkItem>
        <IdentifierLinkItem key="four">
          <IdentifierLink href="https://www.eeoc.gov/">
            {t("link_fear")}
          </IdentifierLink>
        </IdentifierLinkItem>
        <IdentifierLinkItem key="five">
          <IdentifierLink href="https://oig.hhs.gov/">
            {t("link_ig")}
          </IdentifierLink>
        </IdentifierLinkItem>
        <IdentifierLinkItem key="six">
          <IdentifierLink href="https://www.hhs.gov/about/budget/index.html">
            {t("link_performance")}
          </IdentifierLink>
        </IdentifierLinkItem>
        <IdentifierLinkItem key="seven">
          <IdentifierLink href="https://www.grants.gov/web/grants/privacy.html">
            {t("link_privacy")}
          </IdentifierLink>
        </IdentifierLinkItem>
      </IdentifierLinks>
      <IdentifierGov aria-label="U.S. government information and services">
        <Trans
          t={t}
          i18nKey="gov_content"
          components={{
            usaLink: <a href="https://www.usa.gov" />,
          }}
        />
      </IdentifierGov>
    </Identifier>
  );
};

export default GrantsIdentifier;
