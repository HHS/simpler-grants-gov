import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
import "#questions/research/documents.tsp";
using SimplerForms;
namespace Forms.Phs398ResearchPlan;

@doc("Prepare the research strategy and applicable supporting documents. Public reporting burden for this collection of information is estimated to average 10 hours per response, including the time for reviewing instructions, searching existing data sources, gathering and maintaining the data needed, and completing and reviewing the collection of information.  An agency may not conduct or sponsor, and a person is not required to respond to, a collection of information unless it displays a currently valid OMB control number.  Send comments regarding this burden estimate or any other aspect of this collection of information, including suggestions for reducing this burden, to: NIH, Project Clearance Branch, 6705 Rockledge Drive, MSC 7974, Bethesda, MD 20892-7974, ATTN: PRA (0925-0001).  Do not return the completed form to this address. ")
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
  #{ researchStrategy: "00000000-0000-4000-8000-000000007971" },
  #{
    title: "Minimum documents",
    description: "Illustrative UUID only. Research Strategy is required; external application type, animal use and agency instructions may require additional documents. No uploaded file is implied.",
  }
)
@example(
  #{
    introductionToApplication: "00000000-0000-4000-8000-000000007971",
    specificAims: "00000000-0000-4000-8000-000000007972",
    researchStrategy: "00000000-0000-4000-8000-000000007973",
    progressReportPublicationList: "00000000-0000-4000-8000-000000007974",
    vertebrateAnimals: "00000000-0000-4000-8000-000000007975",
    selectAgentResearch: "00000000-0000-4000-8000-000000007976",
    multiplePdPiLeadershipPlan: "00000000-0000-4000-8000-000000007977",
    consortiumContractualArrangements: "00000000-0000-4000-8000-000000007978",
    lettersOfSupport: "00000000-0000-4000-8000-000000007979",
    resourceSharingPlans: "00000000-0000-4000-8000-000000007980",
    otherPlans: "00000000-0000-4000-8000-000000007981",
    authenticationOfKeyBiologicalAndOrChemicalResources: "00000000-0000-4000-8000-000000007982",
    appendix: #[
      "00000000-0000-4000-8000-000000079713",
      "00000000-0000-4000-8000-000000079714"
    ],
  },
  #{
    title: "All document purposes",
    description: "Illustrates every named document field and an ordered Appendix list. Applicability depends on external application context; this is shape coverage, not a claim that all purposes apply to one application.",
  }
)
@example(
  #{
    researchStrategy: "00000000-0000-4000-8000-000000007971",
    appendix: #[
      "00000000-0000-4000-8000-000000079720",
      "00000000-0000-4000-8000-000000079721",
      "00000000-0000-4000-8000-000000079722",
      "00000000-0000-4000-8000-000000079723",
      "00000000-0000-4000-8000-000000079724",
      "00000000-0000-4000-8000-000000079725",
      "00000000-0000-4000-8000-000000079726",
      "00000000-0000-4000-8000-000000079727",
      "00000000-0000-4000-8000-000000079728",
      "00000000-0000-4000-8000-000000079729"
    ],
  },
  #{
    title: "Ten Appendix files",
    description: "DAT Q23 upper boundary: ten illustrative UUIDs. Primary XSD allows up to 100; the narrower DAT business rule is recorded explicitly. File format and source-context rules remain service obligations.",
  }
)
model Phs398ResearchPlan {
  @UI.label("1. Introduction to Application (for Resubmission and Revision applications)")
  introductionToApplication?: Questions.Research.Documents.IntroductionToApplication;

  @doc("Attach PDF formatted file. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("2. Specific Aims")
  specificAims?: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("3. Research Strategy")
  researchStrategy: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. Required if you selected \"Renewal\" for the Type of Application field on the SF424 (R&R) form. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("4. Progress Report Publication List")
  progressReportPublicationList?: Questions.Types.Attachment;

  @UI.label("5. Vertebrate Animals")
  vertebrateAnimals?: Questions.Research.Documents.VertebrateAnimals;

  @UI.label("6. Select Agent Research")
  selectAgentResearch?: Questions.Research.Documents.SelectAgentResearch;

  @UI.label("7. Multiple PD/PI Leadership Plan")
  multiplePdPiLeadershipPlan?: Questions.Research.Documents.MultiplePdPiLeadershipPlan;

  @UI.label("8. Consortium/Contractual Arrangements")
  consortiumContractualArrangements?: Questions.Research.Documents.ConsortiumContractualArrangements;

  @UI.label("9. Letters of Support")
  lettersOfSupport?: Questions.Research.Documents.LettersOfSupport;

  @doc("Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("10. Resource Sharing Plan(s)")
  resourceSharingPlans?: Questions.Types.Attachment;

  @UI.label("11. Other Plan(s)")
  otherPlans?: Questions.Research.Documents.OtherPlans;

  @doc("Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("12. Authentication of Key Biological and/or Chemical Resources")
  authenticationOfKeyBiologicalAndOrChemicalResources?: Questions.Types.Attachment;

  @doc("Attach up to 10 PDF formatted files. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("13. Appendix")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @maxItems(10)
  appendix?: Questions.Types.Attachment[];
}
