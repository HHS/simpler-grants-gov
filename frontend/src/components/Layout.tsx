import { defaultFeatureFlags } from "src/constants/defaultFeatureFlags";
import { envFeatureFlags, environment } from "src/constants/environments";
import { LoginModalProvider } from "src/services/auth/LoginModalProvider";
import UserProvider from "src/services/auth/UserProvider";
import { assignBaseFlags } from "src/services/featureFlags/featureFlagHelpers";

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ActivityMonitor } from "./ActivityMonitor";
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
      <ActivityMonitor />
      <div className="display-flex flex-column minh-viewport">
        <a className="usa-skipnav" href="#main-content">
          {t("Layout.skipToMain")}
        </a>
        <LoginModalProvider>
          <Header locale={locale} localDev={environment.LOCAL_DEV === "true"} />
          <main id="main-content" className="border-top-0">
            {children}
          </main>
        </LoginModalProvider>
        <Footer />
        <GrantsIdentifier />
      </div>
    </UserProvider>
  );
}
