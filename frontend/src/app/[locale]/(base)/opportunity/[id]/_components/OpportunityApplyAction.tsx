"use client";

import { StartApplicationModalControl } from "src/app/[locale]/(base)/opportunity/[id]/_components/StartApplicationModal/StartApplicationModalControl";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { Competition } from "src/types/competitionsResponseTypes";
import { OpportunityStatus } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

import LegacyLink from "src/components/core/LegacyLink";
import { USWDSIcon } from "src/components/core/USWDSIcon";

type OpportunityApplyActionProps = {
  competitions: Competition[] | null;
  // Grants.gov opportunity url for the current environment (resolved server side)
  grantsGovUrl: string;
  legacyOpportunityId: number;
  opportunityId: string;
  opportunityStatus: OpportunityStatus | null;
  opportunityTitle: string | null;
};

/*
  Primary application call to action for the opportunity header
  * a competition that is open for applications on Simpler.Grants.gov -> start a new application
  * otherwise, an open (posted) opportunity -> apply on Grants.gov
  * anything else (forecasted, closed, archived, no status) -> no call to action
*/
export const OpportunityApplyAction = ({
  competitions,
  grantsGovUrl,
  legacyOpportunityId,
  opportunityId,
  opportunityStatus,
  opportunityTitle,
}: OpportunityApplyActionProps) => {
  const t = useTranslations("OpportunityListing.header");
  const { checkFeatureFlag } = useFeatureFlags();

  const openCompetition = (competitions || []).find(({ is_open }) => is_open);

  if (
    openCompetition &&
    opportunityTitle &&
    !checkFeatureFlag("applyFormPrototypeOff")
  ) {
    return (
      <StartApplicationModalControl
        opportunityId={opportunityId}
        opportunityTitle={opportunityTitle}
        competitionId={openCompetition.competition_id}
      />
    );
  }

  if (opportunityStatus !== "posted") {
    return null;
  }

  return (
    <LegacyLink
      href={grantsGovUrl}
      className="usa-button margin-right-0"
      userEvent={{
        name: "click_legacy_opportunity_link",
        properties: {
          legacyOpportunityURL: grantsGovUrl,
          legacyOpportunityId,
        },
      }}
    >
      {t("applyOnGrantsGov")}
      <span className="usa-sr-only"> {t("opensInNewTab")}</span>
      <USWDSIcon name="launch" className="margin-left-1 text-middle" />
    </LegacyLink>
  );
};
