import { ExternalRoutes } from "src/constants/routes";

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

  const logoImage = (
    <Image
      alt={"logo_alt"}
      src={logo}
      className="usa-identifier__logo-img"
    />
  );

  const IdentifierLinkList = [
    {
      href: ExternalRoutes.ABOUT_HHS,
      text: "About HHS",
    },
    {
      href: ExternalRoutes.ACCESSIBILITY_COMPLIANCE,
      text: "Accessibility support",
    },
    {
      href: ExternalRoutes.FOIA,
      text: "FOIA requests",
    },
    {
      href: ExternalRoutes.NO_FEAR,
      text: "EEO/No Fear Act",
    },
    {
      href: ExternalRoutes.INSPECTOR_GENERAL,
      text: "Office of the Inspector General",
    },
    {
      href: ExternalRoutes.PERFORMANCE_REPORTS,
      text: "Performance reports",
    },
    {
      href: ExternalRoutes.PRIVACY_POLICY,
      text: "Privacy Policy",
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
          An official website of the U.S. Department of Health and Human Services
        </IdentifierIdentity>
      </IdentifierMasthead>
      <IdentifierLinks navProps={{ "aria-label": "Important links" }}>
        {IdentifierLinkList}
      </IdentifierLinks>
      <IdentifierGov aria-label="U.S. government information and services">
      </IdentifierGov>
    </Identifier>
  );
};

export default GrantsIdentifier;
