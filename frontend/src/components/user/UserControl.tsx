import { UserProfile } from "src/services/auth/types";
import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  IconList,
  IconListContent,
  IconListIcon,
  IconListItem,
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

const UserDropdown = ({
  user,
  navLogoutLinkText,
  logout,
}: {
  user: UserProfile;
  navLogoutLinkText: string;
  logout: () => {};
}) => {
  const [userProfileMenuOpen, setUserProfileMenuOpen] = useState(false);
  // TODO mobile view
  // TODO match sizing
  const buttonContent = (
    <span className="display-flex flex-align-center">
      <USWDSIcon
        name="account_circle"
        className="usa-icon--size-3 display-block"
      />
      <IconListContent className="font-sans-sm">{user.email}</IconListContent>
    </span>
  );

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
    <div className="usa-nav__primary-item">
      <NavDropDownButton
        label={buttonContent}
        isOpen={userProfileMenuOpen}
        onToggle={() => setUserProfileMenuOpen(!userProfileMenuOpen)}
        isCurrent={false}
        menuId="user-control"
      />
      <Menu
        className="position-absolute"
        id="user-control"
        items={[logoutNavItem]}
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
