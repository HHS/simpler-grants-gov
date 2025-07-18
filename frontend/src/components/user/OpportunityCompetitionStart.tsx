"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { Competition } from "src/types/competitionsResponseTypes";

import { StartApplicationModalControl } from "src/components/workspace/StartApplicationModal/StartApplicationModalControl";

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
