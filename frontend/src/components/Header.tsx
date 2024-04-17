"use client";

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

type HeaderStrings = {
  nav_link_home: string;
  nav_link_process: string;
  nav_link_research: string;
  nav_link_newsletter: string;
  nav_menu_toggle: string;
  title: string;
};

type Props = {
  logoPath?: string;
  header_strings: HeaderStrings;
};

const primaryLinks: PrimaryLinks = [
  { i18nKey: "nav_link_home", href: "/" },
  { i18nKey: "nav_link_process", href: "/process" },
  { i18nKey: "nav_link_research", href: "/research" },
  { i18nKey: "nav_link_newsletter", href: "/newsletter" },
];

const Header = ({ header_strings, logoPath }: Props) => {

  const [isMobileNavExpanded, setIsMobileNavExpanded] = useState(false);
  const handleMobileNavToggle = () => {
    setIsMobileNavExpanded(!isMobileNavExpanded);
  };

  const navItems = primaryLinks.map((link) => (
    <a href={link.href} key={link.href}>
      {header_strings[link.i18nKey]}
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
                <span className="font-sans-lg flex-fill">{header_strings.title}</span>
              </div>
            </Title>
            <NavMenuButton
              onClick={handleMobileNavToggle}
              label={header_strings.nav_menu_toggle}
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
