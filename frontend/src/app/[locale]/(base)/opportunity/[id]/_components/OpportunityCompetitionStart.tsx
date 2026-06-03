"use client";

import { StartApplicationModalControl } from "src/app/[locale]/(base)/opportunity/[id]/_components/StartApplicationModal/StartApplicationModalControl";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { Competition } from "src/types/competitionsResponseTypes";

export const OpportunityCompetitionStart = ({
  competitions,
  opportunityTitle,
}: {
  competitions: [Competition];
  opportunityTitle: string;
}) => {
  const { checkFeatureFlag } = useFeatureFlags();
  const openCompetitions = competitions.filter(({ is_open }) => is_open);

  if (!openCompetitions.length || checkFeatureFlag("applyFormPrototypeOff")) {
    return <></>;
  } else {
    return (
      <>
        <StartApplicationModalControl
          opportunityTitle={opportunityTitle}
          competitionId={openCompetitions[0].competition_id}
        />
      </>
    );
  }
};
