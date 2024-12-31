"use client";

import clsx from "clsx";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
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

const LoginLink = () => {
  return (
    <Link
      href=""
      className="usa-nav__link text-primary font-sans-2xs display-flex text-normal"
    >
      <USWDSIcon
        className="usa-icon margin-right-05 margin-left-neg-05"
        name="login"
      />
      Login
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

const Header = ({ logoPath, locale }: Props) => {
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
  // eslint-disable-next-line
  console.log("$$$$ in header", checkFeatureFlag("authOff"));
  const hideLoginLink = checkFeatureFlag("authOff");

  const language = locale && locale.match("/^es/") ? "spanish" : "english";

  const handleMobileNavToggle = () => {
    setIsMobileNavExpanded(!isMobileNavExpanded);
  };

  const title =
    usePathname() === "/" ? t("title") : <Link href="/">{t("title")}</Link>;

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
                <span className="font-sans-lg flex-fill">{title}</span>
              </div>
            </Title>
            <NavMenuButton
              onClick={handleMobileNavToggle}
              label={t("nav_menu_toggle")}
            />
          </div>
          {!hideLoginLink && (
            <div className="usa-nav__primary margin-top-0 margin-bottom-1 desktop:margin-bottom-5px text-no-wrap desktop:order-last margin-left-auto">
              <div className="usa-nav__primary-item border-0">
                <LoginLink />
              </div>
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
