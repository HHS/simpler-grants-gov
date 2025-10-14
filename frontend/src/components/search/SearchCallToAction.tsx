import { useTranslations } from "next-intl";
import React from "react";

import { ReturnToGrantsNotification } from "src/components/ReturnToGrantsNotification";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const SearchCallToAction = () => {
  const t = useTranslations("Search");

  return (
    <Grid row gap>
      <Grid tabletLg={{ col: "auto" }} className="tablet-lg:order-2">
        <ReturnToGrantsNotification />
      </Grid>
      <Grid tabletLg={{ col: "fill" }}>
        <h1 className="margin-top-0">{t("callToAction.title")}</h1>
      </Grid>
    </Grid>
  );
};

export default SearchCallToAction;
