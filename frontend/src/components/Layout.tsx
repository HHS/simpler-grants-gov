import { defaultFeatureFlags } from "src/constants/defaultFeatureFlags";
import { envFeatureFlags, environment } from "src/constants/environments";
import { LoginModalProvider } from "src/services/auth/LoginModalProvider";
import UserProvider from "src/services/auth/UserProvider";
import { assignBaseFlags } from "src/services/featureFlags/featureFlagHelpers";
import { getTestUsers } from "src/services/fetch/fetchers/userFetcher";
import { TestUser } from "src/types/userTypes";

import { getTranslations, setRequestLocale } from "next-intl/server";

import { ActivityMonitor } from "./ActivityMonitor";
import Footer from "./Footer";
import GrantsIdentifier from "./GrantsIdentifier";
import Header from "./Header";

type Props = {
  children: React.ReactNode;
  locale: string;
};

export default async function Layout({ children, locale }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations();
  let testUsers: TestUser[] = [];

  // to populate local user quick login dropdown
  if (environment.LOCAL_DEV) {
    try {
      // if this returns more than 500 users we likely are in a deployed env and will disable the feature
      testUsers = await getTestUsers();
    } catch (e) {
      console.error("unable to fetch test users, oh well", e);
    }
  }

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
          <Header
            locale={locale}
            localDev={
              environment.LOCAL_DEV === "true" && testUsers.length < 500
            }
            testUsers={testUsers}
          />
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
