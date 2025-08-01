import clsx from "clsx";
import { noop } from "lodash";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";
import { UserProfile } from "src/types/authTypes";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  IconListContent,
  Menu,
  NavDropDownButton,
} from "@trussworks/react-uswds";

import { LoginButtonModal } from "src/components/LoginButtonModal";
import { USWDSIcon } from "src/components/USWDSIcon";

// used in three different places
// 1. on desktop - nav item drop down button content
// 2. on mobile - nav item drop down button content, without email text
// 3. on mobile - nav sub item content
const UserEmailItem = ({
  email,
  isSubnav,
}: {
  email?: string;
  isSubnav: boolean;
}) => {
  return (
    <a
      className={clsx("flex-align-center", "display-flex", {
        "padding-x-0": !isSubnav,
        "desktop:display-none": isSubnav,
        "usa-nav__submenu-item": isSubnav,
        "usa-button": isSubnav,
        "border-y-0": isSubnav,
      })}
    >
      <USWDSIcon
        name="account_circle"
        className="usa-icon--size-3 display-block"
      />
      <div
        className={clsx("padding-left-1", {
          "display-none": !isSubnav,
          "desktop:display-block": !isSubnav,
        })}
      >
        {email}
      </div>
    </a>
  );
};

const UserDropdown = ({
  user,
  navLogoutLinkText,
  logout,
}: {
  user: UserProfile;
  navLogoutLinkText: string;
  logout: () => Promise<void>;
}) => {
  const [userProfileMenuOpen, setUserProfileMenuOpen] = useState(false);
  const t = useTranslations("Header.navLinks");
  const { checkFeatureFlag } = useFeatureFlags();
  const showDeveloperPortal = !checkFeatureFlag("developerPageOff");

  const developerNavItem = showDeveloperPortal ? (
    <a
      href="/developer"
      className="display-flex usa-button usa-button--unstyled text-no-underline"
    >
      <USWDSIcon name="settings" className="usa-icon--size-3 display-block" />
      <IconListContent className="font-sans-sm">
        {t("developer")}
      </IconListContent>
    </a>
  ) : null;

  const logoutNavItem = (
    <a
      className="display-flex usa-button usa-button--unstyled text-no-underline"
      // eslint-disable-next-line
      onClick={() => logout()}
    >
      <USWDSIcon name="logout" className="usa-icon--size-3 display-block" />
      <IconListContent className="font-sans-sm">
        {navLogoutLinkText}
      </IconListContent>
    </a>
  );

  return (
    <div className="usa-nav__primary-item border-top-0 mobile-nav-dropdown-uncollapsed-override position-relative">
      <NavDropDownButton
        className="padding-y-0 padding-x-2 margin-right-2 height-6"
        // The NavDropDownButton needlessly restricts the label to a string, when passing an Element works
        // perfectly well.
        // eslint-disable-next-line
        // @ts-ignore: Type 'Element' is not assignable to type 'string'
        label={<UserEmailItem isSubnav={false} email={user.email} />}
        isOpen={userProfileMenuOpen}
        onClick={(e) => {
          if (!userProfileMenuOpen) {
            setUserProfileMenuOpen(true);
            e.stopPropagation();
            requestAnimationFrame(() =>
              document.addEventListener(
                "click",
                () => {
                  setUserProfileMenuOpen(false);
                },
                { once: true },
              ),
            );
          }
        }}
        onToggle={noop}
        isCurrent={false}
        menuId="user-control"
      />
      <Menu
        className="position-absolute desktop:width-full z-200 right-0"
        id="user-control"
        items={[
          <UserEmailItem key="email" isSubnav={true} email={user.email} />,
          ...(showDeveloperPortal ? [developerNavItem] : []),
          logoutNavItem,
        ].filter(Boolean)}
        type="subnav"
        isOpen={userProfileMenuOpen}
      />
    </div>
  );
};

export const UserControl = () => {
  const t = useTranslations("Header");

  const { user, logoutLocalUser } = useUser();
  const router = useRouter();

  const logout = useCallback(async (): Promise<void> => {
    // this isn't using the clientFetch hook because we don't really need all that added functionality here
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    logoutLocalUser();
    router.refresh();
  }, [logoutLocalUser, router]);

  return (
    <>
      {!user?.token && (
        <LoginButtonModal navLoginLinkText={t("navLinks.login")} />
      )}
      {!!user?.token && (
        <UserDropdown
          user={user}
          navLogoutLinkText={t("navLinks.logout")}
          logout={logout}
        />
      )}
    </>
  );
};
