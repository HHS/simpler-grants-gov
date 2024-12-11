"use client";

import { ErrorProps } from "src/types/uiTypes";

import { useTranslations } from "next-intl";
import { GridContainer } from "@trussworks/react-uswds";

export default function UserError({ error }: ErrorProps) {
  const t = useTranslations("User");
  return (
    <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-15 measure-2">
      <h1>{t("errorHeading")}</h1>
      {error.message && <div>{error.message}</div>}
    </GridContainer>
  );
}
