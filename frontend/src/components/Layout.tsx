import { defaultFeatureFlags } from "src/constants/defaultFeatureFlags";
import { envFeatureFlags } from "src/constants/environments";
import UserProvider from "src/services/auth/UserProvider";
import { assignBaseFlags } from "src/services/featureFlags/featureFlagHelpers";

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import Footer from "./Footer";
import GrantsIdentifier from "./GrantsIdentifier";
import Header from "./Header";

type Props = {
  children: React.ReactNode;
  locale: string;
};

export default function Layout({ children, locale }: Props) {
  setRequestLocale(locale);

  const t = useTranslations();

  return (
    <UserProvider
      featureFlagDefaults={assignBaseFlags(
        defaultFeatureFlags,
        envFeatureFlags,
      )}
    >
      <div className="display-flex flex-column minh-viewport">
        <a className="usa-skipnav" href="#main-content">
          {t("Layout.skipToMain")}
        </a>
        <Header locale={locale} />
        <main id="main-content" className="border-top-0">
          {children}
        </main>
        <Footer />
        <GrantsIdentifier />
      </div>
    </UserProvider>
  );
}
