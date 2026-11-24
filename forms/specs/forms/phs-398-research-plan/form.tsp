import "./examples.tsp";
import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "#questions/research/index.tsp";
using SimplerForms;
namespace Forms.Phs398ResearchPlan;

/** PHS 398 Research Plan, Grants.gov version 5.0. */
@Meta.form(#{ id: "phs-398-research-plan", formName: "PHS 398 Research Plan" })
@Sgg.sync(#{ xml: "mapping" })
@GrantsGov.form(#{
  legacyFormId: 797,
  shortFormName: "PHS398_ResearchPlan_5_0",
  formVersion: "5.0",
  agencyCode: "SGG",
  ombNumber: "0925-0001",
  expirationDate: "2027-12-31",
})
@example(
  Examples.sample1,
  #{
    title: "Minimum documents",
    description: "Illustrative UUID only. Research Strategy is required; external application type, animal use and agency instructions may require additional documents. No uploaded file is implied.",
  }
)
@example(
  Examples.sample2,
  #{
    title: "All document purposes",
    description: "Illustrates every named document field and an ordered Appendix list. Applicability depends on external application context; this is shape coverage, not a claim that all purposes apply to one application.",
  }
)
@example(
  Examples.sample3,
  #{
    title: "Ten Appendix files",
    description: "DAT Q23 upper boundary: ten illustrative UUIDs. Primary XSD allows up to 100; the narrower DAT business rule is recorded explicitly. File format and source-context rules remain service obligations.",
  }
)
model Phs398ResearchPlan {
  introductionToApplication?: Questions.Research.IntroductionToApplication;
  specificAims?: Questions.Research.SpecificAims;
  researchStrategy: Questions.Research.ResearchStrategy;
  progressReportPublicationList?: Questions.Research.ProgressReportPublicationList;
  vertebrateAnimals?: Questions.Research.VertebrateAnimals;
  selectAgentResearch?: Questions.Research.SelectAgentResearch;
  multiplePdPiLeadershipPlan?: Questions.Research.MultiplePdPiLeadershipPlan;
  consortiumContractualArrangements?: Questions.Research.ConsortiumContractualArrangements;
  lettersOfSupport?: Questions.Research.LettersOfSupport;
  resourceSharingPlans?: Questions.Research.ResourceSharingPlans;
  otherPlans?: Questions.Research.OtherPlans;
  keyBiologicalAndOrChemicalResources?: Questions.Research.KeyBiologicalAndOrChemicalResources;
  ...Questions.Research.Appendix;
}
