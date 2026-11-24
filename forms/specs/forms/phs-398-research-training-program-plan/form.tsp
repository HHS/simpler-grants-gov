import "./examples.tsp";
import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";
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
@Sgg.sync(#{ xml: "mapping" })
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
  @UI.label("1. Introduction to Application (for Resubmission and Revision applications)")
  introductionToApplication?: Questions.Research.IntroductionToApplication;

  /** Attach PDF formatted file. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("2. Program Plan")
  programPlan: Questions.Types.Attachment;

  /** Attach PDF formatted file. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("3. Plan for Instruction in the Responsible Conduct of Research")
  responsibleConductOfResearch?: Questions.Types.Attachment;

  /** Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("4. Plan for Instruction in Methods for Enhancing Reproducibility")
  methodsForEnhancingReproducibility?: Questions.Types.Attachment;

  /** Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("5. Multiple PD/PI Leadership Plan (if applicable)")
  multiplePdPiLeadershipPlan?: Questions.Types.Attachment;

  /** Attach PDF formatted file. Required if you selected "Renewal" for the Type of Application field on the SF424 (R&R) form. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("6. Progress Report (for Renewal applications)")
  progressReport?: Questions.Types.Attachment;

  /** Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("7. Participating Faculty Biosketches")
  participatingFacultyBiosketches?: Questions.Types.Attachment;

  /** Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("8. Letters of Support")
  lettersOfSupport?: Questions.Types.Attachment;

  /** Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("9. Data Tables")
  dataTables?: Questions.Types.Attachment;

  @UI.label("10. Vertebrate Animals")
  vertebrateAnimals?: Questions.Research.VertebrateAnimals;

  @UI.label("11. Select Agent Research")
  selectAgentResearch?: Questions.Research.SelectAgentResearch;

  @UI.label("12. Consortium/Contractual Arrangements")
  consortiumContractualArrangements?: Questions.Research.ConsortiumContractualArrangements;

  @UI.label("13. Other Plan(s)")
  otherPlans?: Questions.Research.OtherPlans;

  /** Attach up to 10 PDF formatted files. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("14. Appendix")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @maxItems(10)
  appendix?: Questions.Research.AppendixAttachment[];
}
