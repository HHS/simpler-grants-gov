"use client";

import {
  GovBanner,
  NavMenuButton,
  PrimaryNav,
  Title,
  Header as USWDSHeader,
} from "@trussworks/react-uswds";
import { useEffect, useRef, useState } from "react";

import { assetPath } from "src/utils/assetPath";
import { useFeatureFlags } from "../hooks/useFeatureFlags";

type PrimaryLinks = {
  i18nKey: string;
  href: string;
}[];

// TODO: Remove during move to app router and next-intl upgrade
type HeaderStrings = {
  nav_link_home: string;
  nav_link_search?: string;
  nav_link_process: string;
  nav_link_research: string;
  nav_link_newsletter: string;
  nav_menu_toggle: string;
  title: string;
};

type Props = {
  logoPath?: string;
  header_strings: HeaderStrings;
  locale?: string;
};

const Header = ({ header_strings, logoPath, locale }: Props) => {
  const [isMobileNavExpanded, setIsMobileNavExpanded] = useState(false);
  const handleMobileNavToggle = () => {
    setIsMobileNavExpanded(!isMobileNavExpanded);
  };

  const primaryLinksRef = useRef<PrimaryLinks>([]);
  const { featureFlagsManager } = useFeatureFlags();

  useEffect(() => {
    primaryLinksRef.current = [
      { i18nKey: "nav_link_home", href: "/" },
      { i18nKey: "nav_link_process", href: "/process" },
      { i18nKey: "nav_link_research", href: "/research" },
      { i18nKey: "nav_link_newsletter", href: "/newsletter" },
    ];
    const searchNavLink = {
      i18nKey: "nav_link_search",
      href: "/search?status=forecasted,posted",
    };
    if (featureFlagsManager.isFeatureEnabled("showSearchV0")) {
      primaryLinksRef.current.splice(1, 0, searchNavLink);
    }
  }, [featureFlagsManager]);

  const navItems = primaryLinksRef.current.map((link) => (
    <a href={link.href} key={link.href}>
      {header_strings[link.i18nKey as keyof HeaderStrings]}
    </a>
  ));
  const language = locale && locale.match("/^es/") ? "spanish" : "english";

  return (
    <>
      <div
        className={`usa-overlay ${isMobileNavExpanded ? "is-visible" : ""}`}
      />
      <GovBanner language={language} />
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
                <span className="font-sans-lg flex-fill">
                  {header_strings.title}
                </span>
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
