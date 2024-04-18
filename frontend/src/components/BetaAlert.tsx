"use client";

import Link from "next/link";

import { ExternalRoutes } from "src/constants/routes";
import FullWidthAlert from "./FullWidthAlert";

// TODO: Remove for i18n update.
type BetaStrings = {
  alert_title: string;
  alert: string;
};

type Props = {
  beta_strings: BetaStrings;
};

const BetaAlert = ({ beta_strings }: Props) => {
  // TODO: Remove during move to app router and next-intl upgrade
  const title_start = beta_strings.alert_title.substring(
    0,
    beta_strings.alert_title.indexOf("<LinkToGrants>"),
  );
  const title_end = beta_strings.alert_title.substring(
    beta_strings.alert_title.indexOf("</LinkToGrants>") +
      "</LinkToGrants>".length,
  );
  const link = (
    <>
      {title_start}
      <Link
        target="_blank"
        rel="noopener noreferrer"
        href={ExternalRoutes.GRANTS_HOME}
      >
        www.grants.gov
      </Link>
      {title_end}
    </>
  );

  return (
    <div
      data-testid="beta-alert"
      className="desktop:position-sticky top-0 z-200"
    >
      <FullWidthAlert type="info" heading={link}>
        {beta_strings.alert}
      </FullWidthAlert>
    </div>
  );
};

export default BetaAlert;
