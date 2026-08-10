import clsx from "clsx";
import { LOGOUT_URL } from "src/constants/auth";
// import { useUser } from "src/services/auth/useUser";
import { storeCurrentPage } from "src/utils/userUtils";

import { useTranslations } from "next-intl";

// import { useRouter } from "next/navigation";
// import { useCallback } from "react";

/** Sign out as a nav dropdown child—same structure as NavLink (Link + div) so it matches other menu items */
export const SignOutNavLink = ({
  closeDropdownAndMobileNav,
}: {
  closeDropdownAndMobileNav: () => void;
}) => {
  const t = useTranslations("Header.navLinks");
  // const { logoutLocalUser } = useUser();
  // const router = useRouter();

  // const handleLogout = useCallback(async () => {
  //   await fetch("/api/auth/logout", { method: "POST" });
  //   logoutLocalUser();
  //   router.refresh();
  //   onClick();
  // }, [logoutLocalUser, router, onClick]);

  return (
    <a
      key="sign-in"
      href={LOGOUT_URL}
      onClick={() => {
        storeCurrentPage(location.pathname, location.search);
        closeDropdownAndMobileNav();
      }}
    >
      {t("logout")}
    </a>
  );
  // return (
  //   <Link
  //     href="#"
  //     onClick={(e) => {
  //       e.preventDefault();
  //       handleLogout().catch(() => undefined);
  //     }}
  //   >
  //     {t("logout")}
  //   </Link>
  // );
};
