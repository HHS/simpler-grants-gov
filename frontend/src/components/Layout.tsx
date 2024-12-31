import pick from "lodash/pick";
import { clientSideFeatureFlags } from "src/constants/clientEnvironment";
import FeatureFlagProvider from "src/services/featureFlags/FeatureFlagProvider";

import {
  NextIntlClientProvider,
  useMessages,
  useTranslations,
} from "next-intl";
import { setRequestLocale } from "next-intl/server";

import Footer from "src/components/Footer";
import GrantsIdentifier from "src/components/GrantsIdentifier";
import Header from "src/components/Header";

type Props = {
  children: React.ReactNode;
  locale: string;
};

const UncachedHeader = ({ locale }: { locale: string }) => {
  console.log("$$$$ in uncached header", clientSideFeatureFlags);
  const messages = useMessages();
  return (
    <NextIntlClientProvider locale={locale} messages={pick(messages, "Header")}>
      <FeatureFlagProvider envVarFlags={clientSideFeatureFlags}>
        <Header locale={locale} />
      </FeatureFlagProvider>
    </NextIntlClientProvider>
  );
};

export default function Layout({ children, locale }: Props) {
  setRequestLocale(locale);

  const t = useTranslations();
  // eslint-disable-next-line
  console.log("$$$$ in layout", clientSideFeatureFlags);

  return (
    // Stick the footer to the bottom of the page
    <div className="display-flex flex-column minh-viewport">
      <a className="usa-skipnav" href="#main-content">
        {t("Layout.skip_to_main")}
      </a>
      <UncachedHeader locale={locale} />
      <main id="main-content">{children}</main>
      <Footer />
      <GrantsIdentifier />
    </div>
  );
}
