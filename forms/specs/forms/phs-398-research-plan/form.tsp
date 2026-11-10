import "./examples.tsp";
import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
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
  @doc("Attach PDF formatted file. Required if you selected \"Resubmission\" or \"Revision\" for the Type of Application field on the SF424 (R&R) form. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("1. Introduction to Application (for Resubmission and Revision applications)")
  introductionToApplication?: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("2. Specific Aims")
  specificAims?: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("3. Research Strategy")
  researchStrategy: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. Required if you selected \"Renewal\" for the Type of Application field on the SF424 (R&R) form. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("4. Progress Report Publication List")
  progressReportPublicationList?: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. Required if you checked \"Yes\" for the “Are Vertebrate Animals Used?” question on the R&R Other Project Information form. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("5. Vertebrate Animals")
  vertebrateAnimals?: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("6. Select Agent Research")
  selectAgentResearch?: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("7. Multiple PD/PI Leadership Plan")
  multiplePdPiLeadershipPlan?: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("8. Consortium/Contractual Arrangements")
  consortiumContractualArrangements?: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("9. Letters of Support")
  lettersOfSupport?: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("10. Resource Sharing Plan(s)")
  resourceSharingPlans?: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("11. Other Plan(s)")
  otherPlans?: Questions.Types.Attachment;

  @doc("Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("12. Authentication of Key Biological and/or Chemical Resources")
  authenticationOfKeyBiologicalAndOrChemicalResources?: Questions.Types.Attachment;

  @doc("Attach up to 10 PDF formatted files. See funding opportunity announcement and agency-specific instructions for additional guidance.")
  @UI.label("13. Appendix")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @maxItems(10)
  appendix?: Questions.Types.Attachment[];
}
