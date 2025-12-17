import { environment } from "src/constants/environments";

import { useTranslations } from "next-intl";
import React from "react";
import { Grid } from "@trussworks/react-uswds";

import { ReturnToGrantsNotification } from "src/components/ReturnToGrantsNotification";

const SearchCallToAction = () => {
  const t = useTranslations("Search");

  return (
    <Grid row gap>
      <Grid tabletLg={{ col: "auto" }} className="tablet-lg:order-2">
        <ReturnToGrantsNotification legacyLink={environment.LEGACY_HOST} />
      </Grid>
      <Grid tabletLg={{ col: "fill" }}>
        <h1 className="margin-top-0">{t("callToAction.title")}</h1>
      </Grid>
    </Grid>
  );
};

export default SearchCallToAction;
