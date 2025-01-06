"use client";

import clsx from "clsx";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { UserProfile } from "src/services/auth/types";
import { useUser } from "src/services/auth/useUser";
import { assetPath } from "src/utils/assetPath";

import { useTranslations } from "next-intl";
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

import ContentDisplayToggle from "src/components/ContentDisplayToggle";
import { USWDSIcon } from "src/components/USWDSIcon";

type PrimaryLink = {
  text?: string;
  href?: string;
};

type Props = {
  logoPath?: string;
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

  const navLinkList = useMemo(() => {
    return [
      { text: t("nav_link_home"), href: "/" },
      getSearchLink(path.includes("/search")),
      { text: t("nav_link_process"), href: "/process" },
      { text: t("nav_link_research"), href: "/research" },
      { text: t("nav_link_subscribe"), href: "/subscribe" },
    ];
  }, [t, path, getSearchLink]);

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
      // account for home path
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

const LoginLink = ({ navLoginLinkText }: { navLoginLinkText: string }) => {
  const [authLoginUrl, setAuthLoginUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnv() {
      const res = await fetch("/api/env");
      const data = (await res.json()) as { auth_login_url: string };
      data.auth_login_url
        ? setAuthLoginUrl(data.auth_login_url)
        : console.error("could not access auth_login_url");
    }
    fetchEnv().catch((error) => console.warn("error fetching api/env", error));
  }, []);

  return (
    <div className="usa-nav__primary-item border-0">
      <a
        {...(authLoginUrl ? { href: authLoginUrl } : "")}
        key="login-link"
        className="usa-nav__link text-primary font-sans-2xs display-flex text-normal"
      >
        <USWDSIcon
          className="margin-right-05 margin-left-neg-05"
          name="login"
          key="login-link-icon"
        />
        {navLoginLinkText}
      </a>
    </div>
  );
};

const UserDropdown = ({
  user,
  navLogoutLinkText,
}: {
  user: UserProfile;
  navLogoutLinkText: string;
}) => {
  const logout = useCallback(async (): Promise<void> => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
  }, []);
  return (
    <div>
      <USWDSIcon name="account_circle" />
      <ContentDisplayToggle showCallToAction={user.email || "oops no email"}>
        <USWDSIcon name="logout" />
        <div
          key="login-link"
          className="usa-nav__link text-primary font-sans-2xs display-flex text-normal usa-button usa-button--unstyled"
          onClick={() => logout()}
        >
          {navLogoutLinkText}
        </div>
      </ContentDisplayToggle>
    </div>
  );
};

const Header = ({ logoPath, locale }: Props) => {
  logoPath = "./img/grants-logo.svg";
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

  const { user } = useUser();
  console.log("!!! user", user);

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
        <div className="usa-nav-container display-flex flex-align-end">
          <div className="usa-navbar border-bottom-0">
            <Title className="margin-y-2">
              <div className="display-flex flex-align-center">
                <Link href="/" className="display-block">
                  {logoPath && (
                    <img
                      src={assetPath(logoPath)}
                      alt={t("title")}
                      className="display-block height-4  desktop:height-auto"
                    />
                  )}
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
            <div className="usa-nav__primary margin-top-0 margin-bottom-1 desktop:margin-bottom-5px text-no-wrap desktop:order-last margin-left-auto">
              {!user?.token && (
                <LoginLink navLoginLinkText={t("nav_link_login")} />
              )}
              {!!user?.token && (
                <UserDropdown
                  user={user}
                  navLogoutLinkText={t("nav_link_logout")}
                />
              )}
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
