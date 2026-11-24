import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
import "#questions/research/index.tsp";
import "./examples.tsp";

using SimplerForms;

namespace Forms.Phs398CareerDevelopmentAwardSupplemental;
@Meta.form(#{
  id: "phs-398-career-development-award-supplemental-form",
  formName: "PHS 398 Career Development Award Supplemental Form",
})
@GrantsGov.form(#{
  legacyFormId: 799,
  shortFormName: "PHS398_CareerDevelopmentAwardSup_6_0",
  formVersion: "6.0",
  agencyCode: "SGG",
  ombNumber: "0925-0001",
  expirationDate: "2027-12-31",
})
@example(
  Examples.temporaryVisa,
  #{
    title: "Temporary visa",
    description: "Shows the temporary visa follow-up and two ordered Appendix file IDs.",
  }
)
@example(
  Examples.minimum,
  #{
    title: "Required answers",
    description: "Research Strategy and a citizenship answer. The synthetic file ID represents no uploaded file.",
  }
)
model Form {
  @UI.label("1. Introduction to Application (for Resubmission and Revision applications)")
  introductionToApplication?: Questions.Research.IntroductionToApplication;

  /** Attach a PDF. Check the funding opportunity and agency instructions for whether this attachment is required and what page limit applies. */
  @UI.label("2. Candidate Information and Goals for Career Development")
  candidateInformationAndGoals?: Questions.Types.Attachment;

  @UI.label("3. Specific Aims")
  specificAims?: Questions.Research.SpecificAims;

  @UI.label("4. Research Strategy")
  researchStrategy: Questions.Research.ResearchStrategy;

  @UI.label("5. Progress Report Publication List (for Renewal applications)")
  progressReportPublicationList?: Questions.Research.ProgressReportPublicationList;

  /** Attach PDF formatted file. This attachment is typically required. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("6. Training in the Responsible Conduct of Research")
  responsibleConductOfResearch?: Questions.Types.Attachment;

  /** Attach PDF formatted file. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("7. Candidate's Plan to Provide Mentoring")
  mentoringPlan?: Questions.Types.Attachment;

  /** Attach PDF formatted file. This attachment is typically required. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("8. Plans and Statements of Mentor and Co-Mentor(s)")
  statementsOfSupport?: Questions.Types.Attachment;

  /** Attach PDF formatted file. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("9. Letters of Support from Collaborators, Contributors, and Consultants")
  lettersOfSupport?: Questions.Types.Attachment;

  /** Attach PDF formatted file. This attachment is typically required. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("10. Description of Institutional Environment")
  institutionalEnvironment?: Questions.Types.Attachment;

  /** Attach PDF formatted file. This attachment is typically required. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("11. Institutional Commitment to Candidate’s Research Career Development")
  institutionalCommitment?: Questions.Types.Attachment;

  /** Attach PDF formatted file. This attachment is typically required. See funding opportunity announcement and agency-specific instructions for additional guidance. */
  @UI.label("12. Description of Candidate's Contribution to Program Goals")
  candidatesContribution?: Questions.Types.Attachment;

  @UI.label("13. Vertebrate Animals")
  vertebrateAnimals?: Questions.Research.VertebrateAnimals;

  @UI.label("14. Select Agent Research")
  selectAgentResearch?: Questions.Research.SelectAgentResearch;

  @UI.label("15. Consortium/Contractual Arrangements")
  consortiumContractualArrangements?: Questions.Research.ConsortiumContractualArrangements;

  @UI.label("16. Resource Sharing Plan(s)")
  resourceSharingPlans?: Questions.Research.ResourceSharingPlans;

  @UI.label("17. Other Plan(s)")
  otherPlans?: Questions.Research.OtherPlans;

  @UI.label("18. Authentication of Key Biological and/or Chemical Resources")
  keyBiologicalAndOrChemicalResources?: Questions.Research.KeyBiologicalAndOrChemicalResources;

  @UI.label("19. Appendix")
  @UI.widget(Rendering.Widget.AttachmentArray)
  appendix?: Questions.Research.Appendix;

  @UI.label("20. U.S. Citizen or Non-Citizen National?")
  @UI.widget(Rendering.Widget.Radio)
  isUsCitizenOrNational: boolean;

  @UI.label("If no, select most appropriate Non-U.S. Citizen option")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhen(Form.isUsCitizenOrNational, false)
  @Validation.requiredWhen(Form.isUsCitizenOrNational, false)
  nonUsCitizenshipStatus?: NonUsCitizenshipStatus;

  /** Check if candidate is a non-U.S. citizen with a temporary visa applying for an award that requires permanent residency status, and expect to be granted a permanent resident visa by the start date of the award. */
  @UI.label("Expect permanent resident status by the award start date")
  @UI.widget(Rendering.Widget.Checkbox)
  @UI.enabledWhen(
    Form.nonUsCitizenshipStatus,
    NonUsCitizenshipStatus.temporaryVisa
  )
  permanentResidentByAward?: boolean;
}
enum NonUsCitizenshipStatus {
  permanentResidentVisa: "Permanent U.S. Resident Visa",
  temporaryVisa: "Temporary U.S. Visa",
  notResidingInUs: "Not Residing in the U.S.",
}
