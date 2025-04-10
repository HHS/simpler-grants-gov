"use client";

import clsx from "clsx";
import GrantsLogo from "public/img/grants-logo.svg";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";
import { isCurrentPath } from "src/utils/generalUtils";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GovBanner,
  Menu,
  NavDropDownButton,
  NavMenuButton,
  PrimaryNav,
  Title,
  Header as USWDSHeader,
} from "@trussworks/react-uswds";

import { UserControl } from "./user/UserControl";

type PrimaryLink = {
  text?: string;
  href?: string;
  children?: PrimaryLink[];
};

type Props = {
  locale?: string;
};

const homeRegexp = /^\/(?:e[ns])?$/;

const NavLink = ({
  href = "",
  classes,
  onClick,
  text,
}: {
  href?: string;
  classes?: string;
  onClick: () => void;
  text: string;
}) => {
  return (
    <Link href={href} key={href} className={classes}>
      <div onClick={onClick}>{text}</div>
    </Link>
  );
};

const NavLinks = ({
  mobileExpanded,
  onToggleMobileNav,
}: {
  mobileExpanded: boolean;
  onToggleMobileNav: () => void;
}) => {
  const t = useTranslations("Header.navLinks");
  const path = usePathname();
  const getSearchLink = useCallback(
    (onSearch: boolean) => {
      return {
        text: t("search"),
        href: onSearch ? "/search?refresh=true" : "/search",
      };
    },
    [t],
  );
  const { user } = useUser();
  const { checkFeatureFlag } = useFeatureFlags();
  const showSavedSearch = checkFeatureFlag("savedSearchesOn");
  const showSavedOpportunities = checkFeatureFlag("savedOpportunitiesOn");

  // if we introduce more than one secondary nav this could be expanded to use an index rather than boolean
  const [secondaryNavOpen, setSecondaryNavOpen] = useState<boolean>(false);

  const navLinkList = useMemo(() => {
    const anonymousNavLinks: PrimaryLink[] = [
      { text: t("home"), href: "/" },
      getSearchLink(path.includes("/search")),
      { text: t("roadmap"), href: "/roadmap" },
      { text: t("vision"), href: "/vision" },
      { text: t("subscribe"), href: "/subscribe" },
    ];
    if (!user?.token || (!showSavedOpportunities && !showSavedSearch)) {
      return anonymousNavLinks;
    }

    const workspaceSubNavs = [];
    if (showSavedOpportunities) {
      workspaceSubNavs.push({
        text: t("savedGrants"),
        href: "/saved-grants",
      });
    }
    if (showSavedSearch) {
      workspaceSubNavs.push({
        text: t("savedSearches"),
        href: "/saved-search-queries",
      });
    }

    return anonymousNavLinks.toSpliced(anonymousNavLinks.length, 0, {
      text: t("workspace"),
      children: workspaceSubNavs,
    });
  }, [t, path, getSearchLink, user, showSavedOpportunities, showSavedSearch]);

  const getCurrentNavItemIndex = useCallback(
    (currentPath: string): number => {
      // handle base case of home page separately
      if (currentPath.match(homeRegexp)) {
        return 0;
      }
      const index = navLinkList.slice(1).findIndex(({ href, children }) => {
        if (!href) {
          if (!children?.length) {
            return false;
          }
          // mark as current if any child page is active
          return children.some((child) => {
            return child?.href && isCurrentPath(child.href, currentPath);
          });
        } else {
          return isCurrentPath(href, currentPath);
        }
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

  const closeMobileNav = useCallback(() => {
    if (mobileExpanded) {
      onToggleMobileNav();
    }
  }, [mobileExpanded, onToggleMobileNav]);

  const navItems = useMemo(() => {
    return navLinkList.map((link: PrimaryLink, index: number) => {
      if (!link.text) {
        return <></>;
      }
      if (link.children) {
        const items = link.children.map((childLink) => {
          if (!childLink.text) {
            return <></>;
          }
          return (
            <NavLink
              href={childLink.href}
              key={childLink.href}
              onClick={closeMobileNav}
              text={childLink.text}
            />
          );
        });
        return (
          <>
            <NavDropDownButton
              label={link.text}
              menuId={link.text}
              isOpen={secondaryNavOpen}
              onToggle={() => setSecondaryNavOpen(!secondaryNavOpen)}
              className={clsx({
                "usa-current": currentNavItemIndex === index,
                "simpler-subnav-open": secondaryNavOpen,
              })}
            />
            <Menu
              id={link.text}
              items={items}
              isOpen={secondaryNavOpen}
              className="margin-top-05"
            />
          </>
        );
      }
      return (
        <NavLink
          href={link.href}
          key={link.href}
          onClick={closeMobileNav}
          text={link.text}
          classes={clsx({
            "usa-nav__link": true,
            "usa-current": currentNavItemIndex === index,
          })}
        />
      );
    });
  }, [navLinkList, currentNavItemIndex, secondaryNavOpen, closeMobileNav]);

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
              label={t("navLinks.menuToggle")}
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
