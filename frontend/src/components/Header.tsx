"use client";

import clsx from "clsx";
import GrantsLogo from "public/img/grants-logo.svg";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GovBanner,
  NavMenuButton,
  PrimaryNav,
  Title,
  Header as USWDSHeader,
} from "@trussworks/react-uswds";

import { UserControl } from "./user/UserControl";

type PrimaryLink = {
  text?: string;
  href?: string;
};

type Props = {
  locale?: string;
};

const homeRegexp = /^\/(?:e[ns])?$/;

const NavLinks = ({
  mobileExpanded,
  onToggleMobileNav,
}: {
  mobileExpanded: boolean;
  onToggleMobileNav: () => void;
}) => {
  const t = useTranslations("Header");
  const path = usePathname();
  const getSearchLink = useCallback(
    (onSearch: boolean) => {
      return {
        text: t("nav_link_search"),
        href: onSearch ? "/search?refresh=true" : "/search",
      };
    },
    [t],
  );
  const { user } = useUser();

  const navLinkList = useMemo(() => {
    const anonymousNavLinks = [
      { text: t("nav_link_home"), href: "/" },
      getSearchLink(path.includes("/search")),
      { text: t("nav_link_process"), href: "/process" },
      { text: t("nav_link_research"), href: "/research" },
      { text: t("nav_link_subscribe"), href: "/subscribe" },
    ];
    if (!user?.token) {
      return anonymousNavLinks;
    }

    return anonymousNavLinks.toSpliced(anonymousNavLinks.length, 0, {
      text: t("nav_link_saved_grants"),
      href: "/saved-grants",
    });
  }, [t, path, getSearchLink, user]);

  const getCurrentNavItemIndex = useCallback(
    (currentPath: string): number => {
      // handle base case of home page separately
      if (currentPath.match(homeRegexp)) {
        return 0;
      }
      const index = navLinkList.slice(1).findIndex(({ href }) => {
        const baseHref = href.split("?")[0];
        return currentPath.match(new RegExp(`^(?:/e[ns])?${baseHref}`));
      });
      // account for home path as default / not found
      return index === -1 ? index : index + 1;
    },
    [navLinkList],
  );

  const [currentNavItemIndex, setCurrentNavItemIndex] = useState<number>(
    getCurrentNavItemIndex(path),
  );

  useEffect(() => {
    setCurrentNavItemIndex(getCurrentNavItemIndex(path));
  }, [path, getCurrentNavItemIndex]);

  const navItems = useMemo(() => {
    return navLinkList.map((link: PrimaryLink, index: number) => {
      if (!link.text || !link.href) {
        return <></>;
      }
      return (
        <Link
          href={link.href}
          key={link.href}
          className={clsx({
            "usa-nav__link": true,
            "usa-current": currentNavItemIndex === index,
          })}
        >
          <div
            onClick={() => {
              if (mobileExpanded) {
                onToggleMobileNav();
              }
            }}
          >
            {link.text}
          </div>
        </Link>
      );
    });
  }, [navLinkList, currentNavItemIndex, mobileExpanded, onToggleMobileNav]);

  return (
    <PrimaryNav
      items={navItems}
      mobileExpanded={mobileExpanded}
      onToggleMobileNav={onToggleMobileNav}
    ></PrimaryNav>
  );
};

const Header = ({ locale }: Props) => {
  const t = useTranslations("Header");
  const [isMobileNavExpanded, setIsMobileNavExpanded] =
    useState<boolean>(false);

  const closeMenuOnEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsMobileNavExpanded(false);
    }
  }, []);

  useEffect(() => {
    if (isMobileNavExpanded) {
      document.addEventListener("keyup", closeMenuOnEscape);
    }
    return () => {
      document.removeEventListener("keyup", closeMenuOnEscape);
    };
  }, [isMobileNavExpanded, closeMenuOnEscape]);

  const { checkFeatureFlag } = useFeatureFlags();
  const showLoginLink = checkFeatureFlag("authOn");
  const language = locale && locale.match("/^es/") ? "spanish" : "english";

  const handleMobileNavToggle = () => {
    setIsMobileNavExpanded(!isMobileNavExpanded);
  };

  return (
    <>
      <div
        className={clsx({
          "usa-overlay": true,
          "desktop:display-none": true,
          "is-visible": isMobileNavExpanded,
        })}
        onClick={() => {
          if (isMobileNavExpanded) {
            setIsMobileNavExpanded(false);
          }
        }}
      />
      <GovBanner language={language} />
      <USWDSHeader
        basic={true}
        className="desktop:position-sticky top-0 desktop:z-500 bg-white border-bottom-2px border-primary-vivid"
      >
        <div className="usa-nav-container display-flex flex-justify">
          <div className="usa-navbar border-bottom-0">
            <Title className="margin-y-2">
              <div className="display-flex flex-align-center">
                <Link href="/" className="position-relative">
                  <Image
                    alt={t("title")}
                    src={GrantsLogo as string}
                    className="height-4 display-block position-relative desktop:height-auto"
                    unoptimized
                    priority
                    fill
                  />
                </Link>
              </div>
            </Title>
          </div>
          <div className="usa-navbar order-last desktop:display-none">
            <NavMenuButton
              onClick={handleMobileNavToggle}
              label={t("nav_menu_toggle")}
              className="usa-menu-btn"
            />
          </div>
          {!!showLoginLink && (
            <div className="usa-nav__primary margin-top-0 padding-bottom-05 text-no-wrap desktop:order-last margin-left-auto desktop:height-auto height-6">
              <UserControl />
            </div>
          )}
          <NavLinks
            mobileExpanded={isMobileNavExpanded}
            onToggleMobileNav={handleMobileNavToggle}
          />
        </div>
      </USWDSHeader>
    </>
  );
};

export default Header;
