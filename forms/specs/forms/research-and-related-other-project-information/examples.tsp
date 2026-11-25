import "./form.tsp";
import "./fragments.tsp";
namespace Forms.ResearchAndRelatedOtherProjectInformation.Examples;

const completedOversightReviews: ResearchAndRelatedOtherProjectInformation = #{
  humanSubjectsInvolved: true,
  exemptFromFederalRegulations: false,
  irbReviewPending: false,
  irbApprovalDate: plainDate.fromISO("2026-09-16"),
  humanSubjectAssuranceNumber: "00012345",
  vertebrateAnimalsUsed: true,
  iacucReviewPending: false,
  iacucApprovalDate: plainDate.fromISO("2026-09-17"),
  animalWelfareAssuranceNumber: "D12345678",
  proprietaryInformationIncluded: false,
  environmentalImpact: true,
  environmentalImpactExplanation: "Field sampling at existing research sites.",
  assessmentOrExemptionPerformed: true,
  assessmentOrExemptionExplanation: "EA completed; see applicable agency instructions.",
  historicSiteDesignatedOrEligible: true,
  historicSiteExplanation: "Sampling near an eligible historic research building.",
  internationalActivitiesInvolved: true,
  internationalCountries: "Canada; United Kingdom",
  internationalActivitiesExplanation: "Collaborator field observations.",
  projectSummaryAbstract: "00000000-0000-4000-8000-000000006191",
  projectNarrative: "00000000-0000-4000-8000-000000006192",
  bibliographyReferencesCited: "00000000-0000-4000-8000-000000006193",
  facilitiesOtherResources: "00000000-0000-4000-8000-000000006194",
  equipment: "00000000-0000-4000-8000-000000006195",
  otherAttachments: #[
    "00000000-0000-4000-8000-000000006196",
    "00000000-0000-4000-8000-000000006197"
  ],
};

const exemptResearch: ResearchAndRelatedOtherProjectInformation = #{
  humanSubjectsInvolved: true,
  exemptFromFederalRegulations: true,
  exemptionNumbers: #[ExemptionNumber.one, ExemptionNumber.four],
  humanSubjectAssuranceNumber: "00012345",
  vertebrateAnimalsUsed: true,
  iacucReviewPending: true,
  proprietaryInformationIncluded: false,
  environmentalImpact: false,
  historicSiteDesignatedOrEligible: false,
  internationalActivitiesInvolved: true,
  internationalCountries: "Canada; United Kingdom",
  internationalActivitiesExplanation: "Collaborator field observations.",
  projectSummaryAbstract: "00000000-0000-4000-8000-000000006191",
  projectNarrative: "00000000-0000-4000-8000-000000006192",
  bibliographyReferencesCited: "00000000-0000-4000-8000-000000006193",
  facilitiesOtherResources: "00000000-0000-4000-8000-000000006194",
  equipment: "00000000-0000-4000-8000-000000006195",
  otherAttachments: #[
    "00000000-0000-4000-8000-000000006196",
    "00000000-0000-4000-8000-000000006197"
  ],
};

const preApplication: ResearchAndRelatedOtherProjectInformation = #{
  humanSubjectsInvolved: false,
  vertebrateAnimalsUsed: false,
  proprietaryInformationIncluded: false,
  environmentalImpact: false,
  historicSiteDesignatedOrEligible: false,
  internationalActivitiesInvolved: false,
};
