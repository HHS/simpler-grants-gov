"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";
import { Competition } from "src/types/competitionsResponseTypes";

import StartApplicationModal from "src/components/workspace/StartApplicationModal";

export const OpportunityCompetitionStart = ({
  competitions,
}: {
  competitions: [Competition];
}) => {
  const { user } = useUser();
  const { checkFeatureFlag } = useFeatureFlags();

  const openCompetitions = competitionData({ competitions });

  if (
    !openCompetitions.length ||
    !user?.token ||
    checkFeatureFlag("applyFormPrototypeOff")
  ) {
    return <></>;
  } else {
    return (
      <>
        <StartApplicationModal
          competitionTitle={openCompetitions[0].competition_title}
          competitionId={openCompetitions[0].competition_id}
        />
      </>
    );
  }
};

export const competitionData = ({
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
