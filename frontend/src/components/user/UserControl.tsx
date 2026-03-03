import { testApplicationId } from "src/constants/auth";
import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

// links directly to a test application, only used in local environments when logged in as specific test user
export const TestApplicationLink = () => {
  const t = useTranslations("Header.navLinks");
  return (
    <Link
      className="display-flex usa-button usa-button--unstyled text-no-underline"
      href={`/applications/${testApplicationId}`}
    >
      {t("testApplication")}
    </Link>
  );
};

/** Sign out as a nav dropdown child—same structure as NavLink (Link + div) so it matches other menu items */
export const SignOutNavLink = ({ onClick }: { onClick: () => void }) => {
  const t = useTranslations("Header.navLinks");
  const { logoutLocalUser } = useUser();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    logoutLocalUser();
    router.refresh();
    onClick();
  }, [logoutLocalUser, router, onClick]);

  return (
    <Link
      href="#"
      onClick={(e) => {
        e.preventDefault();
        handleLogout().catch(() => undefined);
      }}
    >
      {t("logout")}
    </Link>
  );
};
