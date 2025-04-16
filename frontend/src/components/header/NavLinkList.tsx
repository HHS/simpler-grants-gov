import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { USWDSIcon } from "src/components/USWDSIcon";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";
import { isCurrentPath } from "src/utils/generalUtils";

import {
  Menu,
  NavDropDownButton,
  PrimaryNav,
} from "@trussworks/react-uswds";

import NavLink from "./NavLink";

type PrimaryLink = {
  text?: string;
  href?: string;
  children?: PrimaryLink[];
};

const homeRegexp = /^\/(?:e[ns])?$/;

const NavLinkList = ({
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
      {
        text: t("about"),
        children: [
          { text: t("vision"), href: "/vision" },
          { text: t("roadmap"), href: "/roadmap" },
        ]
      },
      {
        text: t("community"),
        children: [
          { text: t("subscribe"), href: "/subscribe" },
          { text: t("events"), href: "/events" },
          { text: t("wiki"), href: "https://wiki.simpler.grants.gov/" },
          { text: t("discussion"), href: "https://simplergrants.discourse.group/" },
        ]
      },
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
            <>
              <NavLink
                href={childLink.href}
                key={childLink.href}
                onClick={closeMobileNav}
                text={childLink.text}
              />
              {
                childLink && childLink.href && childLink.href.includes("https") &&
                <USWDSIcon name="launch" className="usa-icon--size-3 padding-top-1" />
              }
            </>
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
        <>
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
        </>
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

export default NavLinkList;