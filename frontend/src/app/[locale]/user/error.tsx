"use client";

import { ErrorProps } from "src/types/uiTypes";

import { useTranslations } from "next-intl";
import { GridContainer } from "@trussworks/react-uswds";

export default function UserError({ error }: ErrorProps) {
  const t = useTranslations("User");
  return (
    <GridContainer>
      <h1>{t("errorHeading")}</h1>
      {error.message && <div>{error.message}</div>}
    </GridContainer>
  );
}
