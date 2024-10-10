"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { assetPath } from "src/utils/assetPath";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  GovBanner,
  NavMenuButton,
  PrimaryNav,
  Title,
  Header as USWDSHeader,
} from "@trussworks/react-uswds";

type PrimaryLinks = {
  linkText: string;
  href: string;
  flag?: string;
}[];

type Props = {
  logoPath?: string;
  locale?: string;
};

const toNavLinkItems = (linkDetails: { linkText: string; href: string }[]) => {
  return linkDetails.map((link) => (
    <a href={link.href} key={link.href}>
      {link.linkText}
    </a>
  ));
};

const Header = ({ logoPath, locale }: Props) => {
  const t = useTranslations("Header");
  const [isMobileNavExpanded, setIsMobileNavExpanded] = useState(false);
  const {
    featureFlagsManager: { featureFlags },
  } = useFeatureFlags();

  const handleMobileNavToggle = () => {
    setIsMobileNavExpanded(!isMobileNavExpanded);
  };

  const primaryNavLinkConfigs: PrimaryLinks = [
    { linkText: t("nav_link_home"), href: "/" },
    { linkText: t("nav_link_process"), href: "/process" },
    { linkText: t("nav_link_research"), href: "/research" },
    { linkText: t("nav_link_subscribe"), href: "/subscribe" },
  ];

  const featureFlaggedNavLinkConfigs: PrimaryLinks = [
    {
      linkText: t("nav_link_search"),
      href: "/search?status=forecasted,posted",
      flag: "showSearchV0",
    },
  ];

  const primaryLinksRef = useRef<PrimaryLinks>(primaryNavLinkConfigs);

  // note that this will not update when feature flags are updated without a refresh
  useEffect(() => {
    const navLinksFromFlags = featureFlaggedNavLinkConfigs.reduce(
      (acc, link) => {
        const { flag = "" } = link;
        console.log("####", featureFlags[flag]);
        if (
          featureFlags[flag] &&
          !primaryLinksRef.current.some(
            (existingLink) => existingLink.href === link.href,
          )
        ) {
          acc.splice(1, 0, link);
        }
        return acc;
      },
      primaryNavLinkConfigs,
    );
    primaryLinksRef.current = navLinksFromFlags;
  }, [featureFlags]);

  const language = useMemo(
    () => (locale && locale.match("/^es/") ? "spanish" : "english"),
    [locale],
  );

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
            items={toNavLinkItems(primaryLinksRef.current)}
            mobileExpanded={isMobileNavExpanded}
            onToggleMobileNav={handleMobileNavToggle}
          ></PrimaryNav>
        </div>
      </USWDSHeader>
    </>
  );
};

export default Header;
