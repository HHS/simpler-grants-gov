"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { assetPath } from "src/utils/assetPath";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

type Props = {
  logoPath?: string;
  locale?: string;
};

const Header = ({ logoPath, locale }: Props) => {
  const t = useTranslations("Header");
  const [isMobileNavExpanded, setIsMobileNavExpanded] = useState(false);
  const handleMobileNavToggle = () => {
    setIsMobileNavExpanded(!isMobileNavExpanded);
  };

  const primaryLinksRef = useRef<PrimaryLinks>([]);
  const { featureFlagsManager } = useFeatureFlags();

  useEffect(() => {
    primaryLinksRef.current = [
      { i18nKey: t("nav_link_home"), href: "/" },
      { i18nKey: t("nav_link_process"), href: "/process" },
      { i18nKey: t("nav_link_research"), href: "/research" },
      { i18nKey: t("nav_link_subscribe"), href: "/subscribe" },
    ];
    const searchNavLink = {
      i18nKey: t("nav_link_search"),
      href: "/search?status=forecasted,posted",
    };
    if (featureFlagsManager.isFeatureEnabled("showSearchV0")) {
      primaryLinksRef.current.splice(1, 0, searchNavLink);
    }
  }, [featureFlagsManager, t]);

  const navItems = primaryLinksRef.current.map((link) => (
    <Link href={link.href} key={link.href}>
      {link.i18nKey}
    </Link>
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
                <span className="font-sans-lg flex-fill">{t("title")}</span>
              </div>
            </Title>
            <NavMenuButton
              onClick={handleMobileNavToggle}
              label={t("nav_menu_toggle")}
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
