import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
import "#questions/research/documents.tsp";
using SimplerForms;
namespace Forms.Phs398ResearchTrainingProgramPlan;

@doc("Prepare the training program plan and applicable supporting documents. Public reporting burden for this collection of information is estimated to average 10 hours per response, including the time for reviewing instructions, searching existing data sources, gathering and maintaining the data needed, and completing and reviewing the collection of information.  An agency may not conduct or sponsor, and a person is not required to respond to, a collection of information unless it displays a currently valid OMB control number.  Send comments regarding this burden estimate or any other aspect of this collection of information, including suggestions for reducing this burden, to: NIH, Project Clearance Branch, 6705 Rockledge Drive, MSC 7974, Bethesda, MD 20892-7974, ATTN: PRA (0925-0001).  Do not return the completed form to this address.")
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
  #{ programPlan: "00000000-0000-4000-8000-000000079801" },
  #{
    title: "Minimum documents",
    description: "Illustrative UUID only. Program Plan is required; application type, animal use and agency instructions may require additional documents. No uploaded file is implied.",
  }
)
@example(
  #{
    introductionToApplication: "00000000-0000-4000-8000-000000079801",
    programPlan: "00000000-0000-4000-8000-000000079802",
    responsibleConductOfResearch: "00000000-0000-4000-8000-000000079803",
    methodsForEnhancingReproducibility: "00000000-0000-4000-8000-000000079804",
    multiplePdPiLeadershipPlan: "00000000-0000-4000-8000-000000079805",
    progressReport: "00000000-0000-4000-8000-000000079806",
    participatingFacultyBiosketches: "00000000-0000-4000-8000-000000079807",
    lettersOfSupport: "00000000-0000-4000-8000-000000079808",
    dataTables: "00000000-0000-4000-8000-000000079809",
    vertebrateAnimals: "00000000-0000-4000-8000-000000079810",
    selectAgentResearch: "00000000-0000-4000-8000-000000079811",
    consortiumContractualArrangements: "00000000-0000-4000-8000-000000079812",
    otherPlans: "00000000-0000-4000-8000-000000079813",
    appendix: #[
      "00000000-0000-4000-8000-000000079820",
      "00000000-0000-4000-8000-000000079821"
    ],
  },
  #{
    title: "All document purposes",
    description: "Illustrates every named document field and an ordered Appendix list. Applicability depends on application context; these synthetic references do not establish PDF content or file existence.",
  }
)
@example(
  #{
    programPlan: "00000000-0000-4000-8000-000000079801",
    appendix: #[
      "00000000-0000-4000-8000-000000079830",
      "00000000-0000-4000-8000-000000079831",
      "00000000-0000-4000-8000-000000079832",
      "00000000-0000-4000-8000-000000079833",
      "00000000-0000-4000-8000-000000079834",
      "00000000-0000-4000-8000-000000079835",
      "00000000-0000-4000-8000-000000079836",
      "00000000-0000-4000-8000-000000079837",
      "00000000-0000-4000-8000-000000079838",
      "00000000-0000-4000-8000-000000079839"
    ],
  },
  #{
    title: "Ten Appendix files",
    description: "Ten illustrative UUIDs demonstrate the Appendix upper boundary. File format, page limits and application context require separate evidence.",
  }
)
model Phs398ResearchTrainingProgramPlan {
  @UI.label("1. Introduction to Application (for Resubmission and Revision applications)")
  introductionToApplication?: Questions.Research.Documents.IntroductionToApplication;

  @doc("Attach PDF formatted file. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("2. Program Plan")
  programPlan: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("3. Plan for Instruction in the Responsible Conduct of Research")
  responsibleConductOfResearch?: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("4. Plan for Instruction in Methods for Enhancing Reproducibility")
  methodsForEnhancingReproducibility?: Questions.Types.Attachment;

  @UI.label("5. Multiple PD/PI Leadership Plan (if applicable)")
  multiplePdPiLeadershipPlan?: Questions.Research.Documents.MultiplePdPiLeadershipPlan;

  @doc("Attach PDF formatted file. Required if you selected \"Renewal\" for the Type of Application field on the SF424 (R&R) form. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("6. Progress Report (for Renewal applications)")
  progressReport?: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("7. Participating Faculty Biosketches")
  participatingFacultyBiosketches?: Questions.Types.Attachment;

  @UI.label("8. Letters of Support")
  lettersOfSupport?: Questions.Research.Documents.LettersOfSupport;

  @doc("Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("9. Data Tables")
  dataTables?: Questions.Types.Attachment;

  @UI.label("10. Vertebrate Animals")
  vertebrateAnimals?: Questions.Research.Documents.VertebrateAnimals;

  @UI.label("11. Select Agent Research")
  selectAgentResearch?: Questions.Research.Documents.SelectAgentResearch;

  @UI.label("12. Consortium/Contractual Arrangements")
  consortiumContractualArrangements?: Questions.Research.Documents.ConsortiumContractualArrangements;

  @UI.label("13. Other Plan(s)")
  otherPlans?: Questions.Research.Documents.OtherPlans;

  @doc("Attach up to 10 PDF formatted files. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("14. Appendix")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @maxItems(10)
  appendix?: Questions.Types.Attachment[];
}
