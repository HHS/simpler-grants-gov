"use client";

import AwardRecommendationsListHeader from "src/app/[locale]/(base)/award-recommendation/_components/AwardRecommendationsListHeader";
import AwardRecommendationsListTable from "src/app/[locale]/(base)/award-recommendation/_components/AwardRecommendationsListTable";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";

import { useState } from "react";

interface AwardRecommendationsListContentProps {
  agencies: RelevantAgencyRecord[];
  currentAgencyId: string;
}

export default function AwardRecommendationsListContent({
  agencies,
  currentAgencyId,
}: AwardRecommendationsListContentProps) {
  const [totalRecords, setTotalRecords] = useState(0);

  return (
    <>
      <AwardRecommendationsListHeader
        awardRecommendationsCount={totalRecords}
        agencies={agencies}
        currentAgencyId={currentAgencyId}
      />
      <AwardRecommendationsListTable
        currentAgencyId={currentAgencyId}
        onTotalRecordsChange={setTotalRecords}
      />
    </>
  );
}
