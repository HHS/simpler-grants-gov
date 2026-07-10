"use client";

import { AgencySelector } from "src/app/[locale]/(base)/grantor/opportunities/_components/AgencySelector";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";

interface AwardRecommendationsListHeaderProps {
  awardRecommendationsCount: number;
  agencies: RelevantAgencyRecord[];
  currentAgencyId: string;
}

export default function AwardRecommendationsListHeader({
  awardRecommendationsCount,
  agencies,
  currentAgencyId,
}: AwardRecommendationsListHeaderProps) {
  const t = useTranslations("AwardRecommendation.list");
  const showHeaderControls = currentAgencyId !== "";

  return (
    <div className="display-flex flex-column gap-3 margin-bottom-4">
      {showHeaderControls && (
        <div className="font-sans-lg text-bold">
          {t("numAwardRecommendations", { num: awardRecommendationsCount })}
        </div>
      )}
      <div className="display-flex flex-justify flex-align-end">
        <div className="maxw-mobile-lg width-full">
          <AgencySelector
            agencies={agencies}
            currentAgencyId={currentAgencyId}
            className="usa-form-group margin-bottom-0 margin-top-4"
          />
        </div>
        {showHeaderControls && (
          <Link
            href="/award-recommendation/create"
            className="usa-button margin-left-auto"
          >
            {t("createRecommendationButton")}
          </Link>
        )}
      </div>
    </div>
  );
}
