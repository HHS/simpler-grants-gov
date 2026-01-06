import clsx from "clsx";
import { noop } from "lodash";
import { applicationTestUserId, testApplicationId } from "src/constants/auth";
import { useClientFetch } from "src/hooks/useClientFetch";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";
import { UserDetailWithProfile } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, NavDropDownButton } from "@trussworks/react-uswds";

import { LoginButton } from "src/components/LoginButton";
import { USWDSIcon } from "src/components/USWDSIcon";

// links directly to a test application, only used in local environments when logged in as specific test user
const TestApplicationLink = () => {
  const t = useTranslations("Header.navLinks");
  return (
    <Link
      className="display-flex usa-button usa-button--unstyled text-no-underline"
      href={`/workspace/applications/application/${testApplicationId}`}
    >
      {t("testApplication")}
    </Link>
  );
};

const SettingsNavLink = () => {
  const t = useTranslations("Header.navLinks");
  return (
    <Link
      className="display-flex usa-button usa-button--unstyled text-no-underline"
      href="/settings"
    >
      {t("settings")}
    </Link>
  );
};

// used in three different places
// 1. on desktop - nav item drop down button content
// 2. on mobile - nav item drop down button content, without email text
// 3. on mobile - nav sub item content
const UserAccountItem = ({ isSubnav }: { isSubnav: boolean }) => {
  const t = useTranslations("Header.navLinks");
  const { user } = useUser();
  const { clientFetch } = useClientFetch<{ data: UserDetailWithProfile }>(
    "Failed to fetch user details",
  );
  const [userDetails, setUserDetails] = useState<UserDetailWithProfile | null>(
    null,
  );
  const isFetchingRef = useRef(false);

  const fetchUserDetails = useCallback(() => {
    if (user?.token && user?.user_id && !isFetchingRef.current) {
      isFetchingRef.current = true;
      clientFetch("/api/user/details")
        .then((response) => {
          setUserDetails(response.data);
        })
        .catch(() => {
          // Silently fail - we'll just show the default icon
        })
        .finally(() => {
          isFetchingRef.current = false;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, user?.user_id]);

  // Initial fetch on mount
  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Listen for profile update events from UserProfileForm
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUserDetails();
    };

    window.addEventListener("userProfileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("userProfileUpdated", handleProfileUpdate);
    };
  }, [fetchUserDetails]);

  const isMissingName =
    !userDetails?.profile?.first_name || !userDetails?.profile?.last_name;
  const iconName = isMissingName ? "warning" : "account_circle";

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
        name={iconName}
        className="usa-icon--size-3 display-block"
        style={isMissingName ? { color: "#FF580A" } : undefined}
      />
      <div
        className={clsx("padding-left-1", {
          "display-none": !isSubnav,
          "desktop:display-block": !isSubnav,
        })}
      >
        {t("account")}
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

export const UserDropdown = ({
  isApplicationTestUser,
}: {
  isApplicationTestUser: boolean;
}) => {
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
        label={<UserAccountItem isSubnav={false} />}
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
          <UserAccountItem key="account" isSubnav={true} />,
          showUserAdminNavItems && <SettingsNavLink key="settings" />,
          isApplicationTestUser && <TestApplicationLink />,
          <LogoutNavItem key="logout" />,
        ].filter(Boolean)}
        type="subnav"
        isOpen={userProfileMenuOpen}
      />
    </div>
  );
};

export const UserControl = ({ localDev }: { localDev: boolean }) => {
  const t = useTranslations("Header");

  const { user } = useUser();

  const isApplicationTestUser =
    localDev && user?.user_id === applicationTestUserId;
  return (
    <>
      {!user?.token && <LoginButton navLoginLinkText={t("navLinks.login")} />}
      {!!user?.token && (
        <UserDropdown isApplicationTestUser={isApplicationTestUser} />
      )}
    </>
  );
};
