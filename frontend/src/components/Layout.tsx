import { defaultFeatureFlags } from "src/constants/defaultFeatureFlags";
import { envFeatureFlags } from "src/constants/environments";
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
          <Header locale={locale} />
          <main id="main-content" className="border-top-0">
            {/* temp Oct 1, 2025 banner */}
            <div className="bg-warning-lighter padding-y-3">
              <div className="grid-container">
                <div className="grid-row grid-gap-4 font-sans-2xs">
                  <div className="tablet-lg:grid-col-5">
                    There has been a lapse in appropriated federal funds as of
                    October 1, 2025.{" "}
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
