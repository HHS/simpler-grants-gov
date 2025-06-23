"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { Competition } from "src/types/competitionsResponseTypes";

import StartApplicationModal from "src/components/workspace/StartApplicationModal";

export const OpportunityCompetitionStart = ({
  competitions,
  opportunityTitle,
}: {
  competitions: [Competition];
  opportunityTitle: string;
}) => {
  const { checkFeatureFlag } = useFeatureFlags();
  const openCompetitions = selectOpenCompetitions({ competitions });

  if (!openCompetitions.length || checkFeatureFlag("applyFormPrototypeOff")) {
    return <></>;
  } else {
    return (
      <>
        <StartApplicationModal
          opportunityTitle={opportunityTitle}
          competitionId={openCompetitions[0].competition_id}
        />
      </>
    );
  }
};

export const selectOpenCompetitions = ({
  competitions,
}: {
  competitions: [Competition];
}) => {
  return competitions.reduce<Competition[]>((acc, competition) => {
    const todayDate = new Date();
    const openingDate = new Date(competition.opening_date);
    const closingDate = new Date(competition.closing_date);
    if (
      competition.is_open &&
      todayDate >= openingDate &&
      todayDate <= closingDate
    ) {
      acc.push(competition);
    }
    return acc;
  }, []);
};
