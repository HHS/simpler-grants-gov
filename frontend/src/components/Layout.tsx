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
            {/* temp Jan 31, 2026 banner */}
            <div className="bg-warning-lighter padding-y-3">
              <div className="grid-container">
                <div className="grid-row grid-gap-4 font-sans-2xs">
                  <div className="tablet-lg:grid-col-5">
                    There has been a lapse in appropriated federal funds as of
                    February 1, 2026.{" "}
                    <a href="https://grants.gov/">Grants.gov</a> and{" "}
                    <a href="https://simpler.grants.gov/">Simpler.Grants.gov</a>{" "}
                    will still be available, but service may be delayed with
                    reduced Federal support staff presence.
                  </div>
                  <div className="tablet-lg:grid-col-7 margin-top-2 tablet-lg:margin-top-0">
                    For those programs affected by the funding lapse, the{" "}
                    <a href="https://grants.gov/">Grants.gov</a> and{" "}
                    <a href="https://simpler.grants.gov/">Simpler.Grants.gov</a>{" "}
                    systems will accept and store applications until such time
                    as the responsible awarding agency has the authority and
                    funding to return to normal business operations.
                  </div>
                </div>
              </div>
            </div>
            {/* end temp banner */}
            {children}
          </main>
        </LoginModalProvider>
        <Footer />
        <GrantsIdentifier />
      </div>
    </UserProvider>
  );
}
