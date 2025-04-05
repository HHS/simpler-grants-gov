import { use } from "react";

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import SearchCallToAction from "src/components/search/SearchCallToAction";
import { SEARCH_CRUMBS } from "src/constants/breadcrumbs";
import { LayoutProps } from "src/types/generalTypes";

export default function SearchLayout({ children, params }: LayoutProps) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("Search.beta_alert");

  return (
    <>
      <BetaAlert
        containerClasses="margin-top-5"
        heading={t("alert_title")}
        alertMessage={t.rich("alert", {
          mailToGrants: (chunks) => (
            <a href="mailto:simpler@grants.gov">{chunks}</a>
          ),
          bugReport: (chunks) => (
            <a href="https://github.com/HHS/simpler-grants-gov/issues/new?template=1_bug_report.yml">
              {chunks}
            </a>
          ),
          featureRequest: (chunks) => (
            <a href="https://github.com/HHS/simpler-grants-gov/issues/new?template=2_feature_request.yml">
              {chunks}
            </a>
          ),
        })}
      />
      <Breadcrumbs breadcrumbList={SEARCH_CRUMBS} />
      <SearchCallToAction />
      {children}
    </>
  );
}
