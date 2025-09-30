import clsx from "clsx";
import { noop } from "lodash";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";
import { UserProfile } from "src/types/authTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Menu, NavDropDownButton } from "@trussworks/react-uswds";

import { LoginButton } from "src/components/LoginButton";
import { USWDSIcon } from "src/components/USWDSIcon";

const AccountNavLink = () => {
  const t = useTranslations("Header.navLinks");
  return (
    <Link
      className="display-flex usa-button usa-button--unstyled text-no-underline"
      href="/user/account"
    >
      {t("account")}
    </Link>
  );
};

const WorkspaceNavLink = () => {
  const t = useTranslations("Header.navLinks");
  return (
    <Link
      className="display-flex usa-button usa-button--unstyled text-no-underline"
      href="/user/workspace"
    >
      <USWDSIcon
        name="notifications_active"
        className="usa-icon--size-3 display-block"
      />
      {t("workspace")}
    </Link>
  );
};

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

const LogoutNavItem = () => {
  const t = useTranslations("Header.navLinks");

  const { logoutLocalUser } = useUser();
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
    <a
      className="display-flex usa-button usa-button--unstyled text-no-underline"
      // eslint-disable-next-line
      onClick={() => logout()}
    >
      <USWDSIcon name="logout" className="usa-icon--size-3 display-block" />
      {t("logout")}
    </a>
  );
};

const UserDropdown = ({ user }: { user: UserProfile }) => {
  const [userProfileMenuOpen, setUserProfileMenuOpen] = useState(false);

  const { checkFeatureFlag } = useFeatureFlags();

  const showUserAdminNavItems = !checkFeatureFlag("userAdminOff");

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
          showUserAdminNavItems && <AccountNavLink key="account" />,
          showUserAdminNavItems && <WorkspaceNavLink key="workspace" />,
          <LogoutNavItem key="logout" />,
        ].filter(Boolean)}
        type="subnav"
        isOpen={userProfileMenuOpen}
      />
    </div>
  );
};

export const UserControl = () => {
  const t = useTranslations("Header");

  const { user } = useUser();

  return (
    <>
      {!user?.token && <LoginButton navLoginLinkText={t("navLinks.login")} />}
      {!!user?.token && <UserDropdown user={user} />}
    </>
  );
};
