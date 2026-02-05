"use client";

import clsx from "clsx";
import GrantsLogo from "public/img/grants-logo.svg";
import { ExternalRoutes } from "src/constants/routes";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useSnackbar } from "src/hooks/useSnackbar";
import { useUser } from "src/services/auth/useUser";
import { IndexType } from "src/types/generalTypes";
import { TestUser } from "src/types/userTypes";
import { isCurrentPath, isExternalLink } from "src/utils/generalUtils";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  GovBanner,
  NavMenuButton,
  PrimaryNav,
  Title,
  Header as USWDSHeader,
} from "@trussworks/react-uswds";

import { LOGIN_URL } from "src/constants/auth";
import { USWDSIcon } from "src/components/USWDSIcon";
import NavDropdown from "./NavDropdown";
import { storeCurrentPage } from "src/utils/userUtils";
import { RouteChangeWatcher } from "./RouteChangeWatcher";
import { TestUserSelect } from "./TestUserSelect";
import { UserControl } from "./user/UserControl";

type PrimaryLink = {
  text?: string;
  href?: string;
  children?: PrimaryLink[];
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
  let iconBtnClass, linkTarget;

  if (isExternalLink(href)) {
    iconBtnClass = "icon-btn";
    linkTarget = "_blank";
  }

  return (
    <Link href={href} key={href} className={classes} target={linkTarget}>
      <div onClick={onClick} className={iconBtnClass}>
        {text}
        {isExternalLink(href) && (
          <USWDSIcon name="launch" className="usa-icon--size-2" />
        )}
      </div>
    </Link>
  );
};

const NavLinks = ({
  mobileExpanded,
  onToggleMobileNav,
  showLoginLink,
}: {
  mobileExpanded: boolean;
  onToggleMobileNav: () => void;
  showLoginLink?: boolean;
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

  const navLinkList = useMemo(() => {
    const anonymousNavLinks: PrimaryLink[] = [
      { text: t("home"), href: "/" },
      getSearchLink(path.includes("/search")),
      {
        text: t("about"),
        children: [
          { text: t("vision"), href: "/vision" },
          { text: t("roadmap"), href: "/roadmap" },
        ],
      },
      {
        text: t("community"),
        children: [
          { text: t("newsletter"), href: "/newsletter" },
          { text: t("events"), href: "/events" },
          { text: t("developers"), href: "/developer" },
          { text: t("wiki"), href: ExternalRoutes.WIKI },
          { text: t("forum"), href: ExternalRoutes.FORUM },
        ],
      },
    ];
    if (!user?.token) {
      return anonymousNavLinks;
    }

    const workspaceSubNavs = [];

    workspaceSubNavs.push({
      text: t("activityDashboard"),
      href: "/dashboard",
    });

    workspaceSubNavs.push({
      text: t("applications"),
      href: "/applications",
    });
    workspaceSubNavs.push({
      text: t("organizations"),
      href: "/organizations",
    });

    workspaceSubNavs.push({
      text: t("savedOpportunities"),
      href: "/saved-opportunities",
    });

    workspaceSubNavs.push({
      text: t("savedSearches"),
      href: "/saved-search-queries",
    });

    return anonymousNavLinks.toSpliced(anonymousNavLinks.length, 0, {
      text: t("workspace"),
      children: workspaceSubNavs,
    });
  }, [t, path, getSearchLink, user]);

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
  const [activeNavDropdownIndex, setActiveNavDropdownIndex] =
    useState<IndexType>(null);

  useEffect(() => {
    setCurrentNavItemIndex(getCurrentNavItemIndex(path));
  }, [path, getCurrentNavItemIndex]);

  const closeMobileNav = useCallback(() => {
    if (mobileExpanded) {
      onToggleMobileNav();
    }
  }, [mobileExpanded, onToggleMobileNav]);

  const closeDropdownAndMobileNav = useCallback(() => {
    setActiveNavDropdownIndex(null);
    closeMobileNav();
  }, [closeMobileNav]);

  const navItems = useMemo(() => {
    const items = navLinkList.map((link: PrimaryLink, index: number) => {
      if (!link.text) {
        return <></>;
      }
      if (link.children) {
        const childItems = link.children.map((childLink) => {
          if (!childLink.text) {
            return <></>;
          }
          return (
            <NavLink
              href={childLink.href}
              key={childLink.href}
              onClick={closeDropdownAndMobileNav}
              text={childLink.text}
            />
          );
        });
        return (
          <NavDropdown
            key={link.href}
            activeNavDropdownIndex={activeNavDropdownIndex}
            index={index}
            isCurrent={currentNavItemIndex === index}
            linkText={link.text}
            menuItems={childItems}
            setActiveNavDropdownIndex={setActiveNavDropdownIndex}
          />
        );
      }
      return (
        <NavLink
          href={link.href}
          key={link.href}
          onClick={closeDropdownAndMobileNav}
          text={link.text}
          classes={clsx({
            "usa-nav__link": true,
            "usa-current": currentNavItemIndex === index,
            "text-bold": true,
          })}
        />
      );
    });

    if (showLoginLink && !user?.token) {
      items.push(
        <NavLink
          key="sign-in-mobile"
          href={LOGIN_URL}
          onClick={() => {
            storeCurrentPage();
            closeDropdownAndMobileNav();
          }}
          text={t("login")}
          classes={clsx({
            "usa-nav__link": true,
            "desktop:display-none": true,
          })}
        />,
      );
    }

    return items;
  }, [
    activeNavDropdownIndex,
    closeDropdownAndMobileNav,
    currentNavItemIndex,
    navLinkList,
    setActiveNavDropdownIndex,
    showLoginLink,
    t,
    user?.token,
  ]);

  return (
    <PrimaryNav
      items={navItems}
      mobileExpanded={mobileExpanded}
      onToggleMobileNav={onToggleMobileNav}
    ></PrimaryNav>
  );
};

const Header = ({
  locale,
  localDev = false,
  testUsers = [],
}: {
  locale?: string;
  localDev?: boolean;
  testUsers?: TestUser[];
}) => {
  const t = useTranslations("Header");
  const [isMobileNavExpanded, setIsMobileNavExpanded] =
    useState<boolean>(false);

  const { hasBeenLoggedOut, resetHasBeenLoggedOut, user } = useUser();
  const { showSnackbar, Snackbar, hideSnackbar, snackbarIsVisible } =
    useSnackbar();

  useEffect(() => {
    if (hasBeenLoggedOut) {
      showSnackbar(-1);
      resetHasBeenLoggedOut();
    }
  }, [hasBeenLoggedOut, showSnackbar, resetHasBeenLoggedOut]);

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
      <Suspense>
        <RouteChangeWatcher />
      </Suspense>
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
          {localDev && testUsers && <TestUserSelect testUsers={testUsers} />}
          <div className="usa-navbar order-last desktop:display-none">
            <NavMenuButton
              onClick={handleMobileNavToggle}
              label={t("navLinks.menuToggle")}
              className="usa-menu-btn"
            />
          </div>
          {!!showLoginLink && (
            <div
              className={clsx(
                "usa-nav__primary margin-top-0 padding-bottom-0 desktop:padding-bottom-05 text-no-wrap desktop:order-last margin-left-auto desktop:height-auto height-6",
                { "display-none desktop:display-block": !user?.token },
              )}
            >
              <UserControl localDev={localDev} />
            </div>
          )}
          <NavLinks
            mobileExpanded={isMobileNavExpanded}
            onToggleMobileNav={handleMobileNavToggle}
            showLoginLink={showLoginLink}
          />
        </div>
      </USWDSHeader>
      <Snackbar close={hideSnackbar} isVisible={snackbarIsVisible}>
        {t("tokenExpired")}
      </Snackbar>
    </>
  );
};

export default Header;
