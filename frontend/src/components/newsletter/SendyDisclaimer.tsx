import { useTranslations } from "next-intl";
import { GridContainer } from "@trussworks/react-uswds";

export default function SendyDisclaimer() {
  const t = useTranslations("SendyDisclaimer");

  return (
    <GridContainer className="padding-y-3 border-top-2px border-base-lightest margin-top-4 tablet-lg:margin-top-6">
      <p className="font-sans-3xs text-base-dark">{t("disclaimer")}</p>
    </GridContainer>
  );
}
