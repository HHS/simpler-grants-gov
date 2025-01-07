import clsx from "clsx";
import { UserProfile } from "src/services/auth/types";
import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  IconListContent,
  Menu,
  NavDropDownButton,
} from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

const LoginLink = ({
  navLoginLinkText,
  loginUrl,
}: {
  navLoginLinkText: string;
  loginUrl: string;
}) => {
  return (
    <div className="usa-nav__primary-item border-0">
      <a
        {...(loginUrl ? { href: loginUrl } : "")}
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
        "desktop:display-none": isSubnav,
        "usa-nav__submenu-item": isSubnav,
      })}
    >
      <USWDSIcon
        name="account_circle"
        className="usa-icon--size-3 display-block"
      />
      <IconListContent
        className={clsx("font-sans-sm", {
          "display-none": !isSubnav,
          "desktop:display-block": !isSubnav,
        })}
      >
        {email}
      </IconListContent>
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
  // TODO mobile view
  // TODO match sizing

  const logoutNavItem = (
    <a
      className="display-flex usa-button usa-button--unstyled text-no-underline"
      onClick={() => logout()}
    >
      <USWDSIcon name="logout" className="usa-icon--size-3 display-block" />
      <IconListContent className="font-sans-sm">
        {navLogoutLinkText}
      </IconListContent>
    </a>
  );

  return (
    <div className="usa-nav__primary-item border-top-0 mobile-nav-dropdown-uncollapsed-override">
      <NavDropDownButton
        className="padding-0 desktop:padding-bottom-1 desktop:padding-x-2 margin-right-2 height-6"
        label={<UserEmailItem isSubnav={false} email={user.email} />}
        isOpen={userProfileMenuOpen}
        onToggle={() => setUserProfileMenuOpen(!userProfileMenuOpen)}
        isCurrent={false}
        menuId="user-control"
      />
      <Menu
        className="position-absolute z-index-10000 desktop:width-full z-top"
        id="user-control"
        items={[
          <UserEmailItem key="email" isSubnav={true} email={user.email} />,
          logoutNavItem,
        ]}
        type="subnav"
        isOpen={userProfileMenuOpen}
      />
    </div>
  );
};

export const UserControl = () => {
  const t = useTranslations("Header");

  const { user, refreshUser } = useUser();

  const logout = useCallback(async (): Promise<void> => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    await refreshUser();
  }, [refreshUser]);

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
    <>
      {!user?.token && (
        <LoginLink
          navLoginLinkText={t("nav_link_login")}
          loginUrl={authLoginUrl || ""}
        />
      )}
      {!!user?.token && (
        <UserDropdown
          user={user}
          navLogoutLinkText={t("nav_link_logout")}
          logout={logout}
        />
      )}
    </>
  );
};
