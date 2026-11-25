import "./examples.tsp";
import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/research/index.tsp";
using SimplerForms;
namespace Forms.Phs398ResearchPlan;

/** PHS 398 Research Plan, Grants.gov version 5.0. */
@Meta.form(#{ id: "phs-398-research-plan", formName: "PHS 398 Research Plan" })
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
  @UI.label("1. Introduction to Application (for Resubmission and Revision applications)")
  introductionToApplication?: Questions.Research.IntroductionToApplication;

  @UI.label("2. Specific Aims")
  specificAims?: Questions.Research.SpecificAims;

  @UI.label("3. Research Strategy")
  researchStrategy: Questions.Research.ResearchStrategy;

  @UI.label("4. Progress Report Publication List (for Renewal applications)")
  progressReportPublicationList?: Questions.Research.ProgressReportPublicationList;

  @UI.label("5. Vertebrate Animals")
  vertebrateAnimals?: Questions.Research.VertebrateAnimals;

  @UI.label("6. Select Agent Research")
  selectAgentResearch?: Questions.Research.SelectAgentResearch;

  @UI.label("7. Multiple PD/PI Leadership Plan")
  multiplePdPiLeadershipPlan?: Questions.Research.MultiplePdPiLeadershipPlan;

  @UI.label("8. Consortium/Contractual Arrangements")
  consortiumContractualArrangements?: Questions.Research.ConsortiumContractualArrangements;

  @UI.label("9. Letters of Support")
  lettersOfSupport?: Questions.Research.LettersOfSupport;

  @UI.label("10. Resource Sharing Plan(s)")
  resourceSharingPlans?: Questions.Research.ResourceSharingPlans;

  @UI.label("11. Other Plan(s)")
  otherPlans?: Questions.Research.OtherPlans;

  @UI.label("12. Authentication of Key Biological and/or Chemical Resources")
  keyBiologicalAndOrChemicalResources?: Questions.Research.KeyBiologicalAndOrChemicalResources;

  @UI.label("13. Appendix")
  @UI.widget(Rendering.Widget.AttachmentArray)
  appendix?: Questions.Research.Appendix;
}
