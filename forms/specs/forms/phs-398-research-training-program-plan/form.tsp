import "./examples.tsp";
import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
import "#questions/research/index.tsp";
using SimplerForms;
namespace Forms.Phs398ResearchTrainingProgramPlan;

/** PHS 398 Research Training Program Plan, Grants.gov version 5.0. */
@Meta.form(#{
  id: "phs-398-research-training-program-plan",
  formName: "PHS 398 Research Training Program Plan",
})
@GrantsGov.form(#{
  legacyFormId: 798,
  shortFormName: "PHS398_ResearchTrainingProgramPlan_5_0",
  formVersion: "5.0",
  agencyCode: "SGG",
  ombNumber: "0925-0001",
  expirationDate: "2027-12-31",
})
@example(
  Examples.sample3,
  #{
    title: "Ten Appendix files",
    description: "Ten illustrative UUIDs demonstrate the Appendix upper boundary. File format, page limits and application context require separate evidence.",
  }
)
@example(
  Examples.sample2,
  #{
    title: "All document purposes",
    description: "Illustrates every named document field and an ordered Appendix list. Applicability depends on application context; these synthetic references do not establish PDF content or file existence.",
  }
)
@example(
  Examples.sample1,
  #{
    title: "Minimum documents",
    description: "Illustrative UUID only. Program Plan is required; application type, animal use and agency instructions may require additional documents. No uploaded file is implied.",
  }
)
model Phs398ResearchTrainingProgramPlan {
  introductionToApplication?: Questions.Research.IntroductionToApplication;

  /** Attach PDF formatted file. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("Program Plan")
  programPlan: Questions.Types.Attachment;

  /** Attach PDF formatted file. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("Plan for Instruction in the Responsible Conduct of Research")
  responsibleConductOfResearch?: Questions.Types.Attachment;

  /** Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("Plan for Instruction in Methods for Enhancing Reproducibility")
  methodsForEnhancingReproducibility?: Questions.Types.Attachment;

  multiplePdPiLeadershipPlan?: Questions.Research.MultiplePdPiLeadershipPlan;

  /** Attach PDF formatted file. Required if you selected "Renewal" for the Type of Application field on the SF424 (R&R) form. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("Progress Report (for Renewal applications)")
  progressReport?: Questions.Types.Attachment;

  /** Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("Participating Faculty Biosketches")
  participatingFacultyBiosketches?: Questions.Types.Attachment;

  lettersOfSupport?: Questions.Research.LettersOfSupport;

  /** Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("Data Tables")
  dataTables?: Questions.Types.Attachment;

  vertebrateAnimals?: Questions.Research.VertebrateAnimals;
  selectAgentResearch?: Questions.Research.SelectAgentResearch;
  consortiumContractualArrangements?: Questions.Research.ConsortiumContractualArrangements;
  otherPlans?: Questions.Research.OtherPlans;
  ...Questions.Research.Appendix;
}
