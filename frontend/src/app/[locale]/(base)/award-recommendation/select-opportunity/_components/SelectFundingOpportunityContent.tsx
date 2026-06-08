"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@trussworks/react-uswds";

export const SelectFundingOpportunityContent = () => {
  const t = useTranslations("AwardRecommendationSelectFundingOpportunity");
  const router = useRouter();

  const handleCancel = () => {
    router.push("/");
  };

  return (
    <>
      <div className="margin-top-5 margin-bottom-5">
        <h2 className="margin-top-0 margin-bottom-2 font-sans-xl text-bold">
          {t("whichFundingOpportunity")}
        </h2>
      </div>

      <div className="margin-top-5">
        <Button
          type="button"
          className="usa-button--outline"
          onClick={handleCancel}
        >
          {t("cancelButtonText")}
        </Button>
      </div>
    </>
  );
};
