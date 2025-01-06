import { UserProfile } from "src/services/auth/types";
import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import ContentDisplayToggle from "src/components/ContentDisplayToggle";
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

export const UserControl = () => {
  const t = useTranslations("Header");

  const logout = useCallback(async (): Promise<void> => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    refreshUser();
  }, []);

  const { user, refreshUser } = useUser();
  console.log("!!!! user", user);

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
