import { LOGOUT_URL } from "src/constants/auth";
import { storeCurrentPage } from "src/utils/userUtils";

import { useTranslations } from "next-intl";

/** Sign out as a nav dropdown child—same structure as NavLink (Link + div) so it matches other menu items */
export const SignOutNavLink = ({
  closeDropdownAndMobileNav,
}: {
  closeDropdownAndMobileNav: () => void;
}) => {
  const t = useTranslations("Header.navLinks");

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
};
