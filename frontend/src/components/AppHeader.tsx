'use client';

import { assetPath } from "src/utils/assetPath";

import { useState } from "react";
import {
  GovBanner,
  NavMenuButton,
  PrimaryNav,
  Title,
  Header as USWDSHeader,
} from "@trussworks/react-uswds";

type PrimaryLinks = {
  i18nKey: string;
  href: string;
}[];

const primaryLinks: PrimaryLinks = [
  { i18nKey: "Home", href: "/" },
  { i18nKey: "Process", href: "/process" },
  { i18nKey: "Reseach", href: "/research" },
  { i18nKey: "Newsletter", href: "/newsletter" },
];

type Props = {
  logoPath?: string;
};

const Header = ({ logoPath }: Props) => {

  const [isMobileNavExpanded, setIsMobileNavExpanded] = useState(false);
  const handleMobileNavToggle = () => {
    setIsMobileNavExpanded(!isMobileNavExpanded);
  };

  const navItems = primaryLinks.map((link) => (
    <a href={link.href} key={link.href}>
      {link.i18nKey}
    </a>
  ));

  return (
    <>
      <div
        className={`usa-overlay ${isMobileNavExpanded ? "is-visible" : ""}`}
      />
      <GovBanner
        language={"english"}
      />
      <USWDSHeader basic={true}>
        <div className="usa-nav-container">
          <div className="usa-navbar">
            <Title className="desktop:margin-top-2">
              <div className="display-flex flex-align-center">
                {logoPath && (
                  <span className="margin-right-1">
                    <img
                      className="width-3 desktop:width-5 text-bottom margin-right-05"
                      src={assetPath(logoPath)}
                      alt="Site logo"
                    />
                  </span>
                )}
                <span className="font-sans-lg flex-fill">{"Simpler.Grants.gov"}</span>
              </div>
            </Title>
            <NavMenuButton
              onClick={handleMobileNavToggle}
              label={"nav_menu_toggle"}
            />
          </div>
          <PrimaryNav
            items={navItems}
            mobileExpanded={isMobileNavExpanded}
            onToggleMobileNav={handleMobileNavToggle}
          ></PrimaryNav>
        </div>
      </USWDSHeader>
    </>
  );
};

export default Header;
