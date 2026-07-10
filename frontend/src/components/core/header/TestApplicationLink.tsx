import { testApplicationId } from "src/constants/auth";

import { useTranslations } from "next-intl";
import Link from "next/link";

// links directly to a test application, only used in local environments when logged in as specific test user
export const TestApplicationLink = () => {
  const t = useTranslations("Header.navLinks");
  return (
    <Link
      className="display-flex usa-button usa-button--unstyled text-no-underline"
      href={`/workspace/applications/${testApplicationId}`}
    >
      {t("testApplication")}
    </Link>
  );
};
