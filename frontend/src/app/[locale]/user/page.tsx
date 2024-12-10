"use client";

import { useTranslations } from "next-intl";
import { GridContainer } from "@trussworks/react-uswds";

export default function UserDisplay({
  searchParams,
}: {
  searchParams: { message?: string };
}) {
  const { message } = searchParams;
  const t = useTranslations("User");
  return (
    <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-15 measure-2">
      <h1>{t("heading")}</h1>
      {message && <div>{message}</div>}
    </GridContainer>
  );
}
