import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.Phs398CareerDevelopmentAwardSupplemental;

@UI.layout(Form)
model FormLayout {
  /** Attach an Introduction to Application for Resubmission and Revision applications. */
  @UI.label("Introduction")
  section1: {
    @UI.label("1. Introduction to Application (for Resubmission and Revision applications)")
    introductionToApplication: Form.introductionToApplication;
  };

  @UI.label("Candidate Section")
  section2: {
    @UI.label("2. Candidate Information and Goals for Career Development")
    candidateInformationAndGoals: Form.candidateInformationAndGoals;
  };

  /** Research Strategy is required. Include the Progress Report Publication List for Renewal applications. It is optional for Resubmission. */
  @UI.label("Research Plan Section")
  section3: {
    @UI.label("3. Specific Aims")
    specificAims: Form.specificAims;

    @UI.label("4. Research Strategy")
    researchStrategy: Form.researchStrategy;

    @UI.label("5. Progress Report Publication List (for Renewal applications)")
    progressReportPublicationList: Form.progressReportPublicationList;

    @UI.label("6. Training in the Responsible Conduct of Research")
    responsibleConductOfResearch: Form.responsibleConductOfResearch;
  };

  @UI.label("Other Candidate Information Section")
  section4: {
    @UI.label("7. Candidate's Plan to Provide Mentoring")
    mentoringPlan: Form.mentoringPlan;
  };

  @UI.label("Mentor, Co-Mentor, Consultant, Collaborators Section")
  section5: {
    @UI.label("8. Plans and Statements of Mentor and Co-Mentor(s)")
    statementsOfSupport: Form.statementsOfSupport;

    @UI.label("9. Letters of Support from Collaborators, Contributors, and Consultants")
    lettersOfSupport: Form.lettersOfSupport;
  };

  @UI.label("Environment and Institutional Commitment to the Candidate Section")
  section6: {
    @UI.label("10. Description of Institutional Environment")
    institutionalEnvironment: Form.institutionalEnvironment;

    @UI.label("11. Institutional Commitment to Candidate’s Research Career Development")
    institutionalCommitment: Form.institutionalCommitment;

    @UI.label("12. Description of Candidate's Contribution to Program Goals")
    candidatesContribution: Form.candidatesContribution;
  };

  /** Include Vertebrate Animals if you answered Yes to the animals-used question on R&R Other Project Information. */
  @UI.label("Other Research Plan Section")
  section7: {
    @UI.label("13. Vertebrate Animals")
    vertebrateAnimals: Form.vertebrateAnimals;

    @UI.label("14. Select Agent Research")
    selectAgentResearch: Form.selectAgentResearch;

    @UI.label("15. Consortium/Contractual Arrangements")
    consortiumContractualArrangements: Form.consortiumContractualArrangements;

    @UI.label("16. Resource Sharing Plan(s)")
    resourceSharingPlans: Form.resourceSharingPlans;

    @UI.label("17. Other Plan(s)")
    otherPlans: Form.otherPlans;

    @UI.label("18. Authentication of Key Biological and/or Chemical Resources")
    keyBiologicalAndOrChemicalResources: Form.keyBiologicalAndOrChemicalResources;
  };

  @UI.label("Appendix")
  section8: {
    @UI.label("19. Appendix")
    appendix: Form.appendix;
  };

  @UI.label("Citizenship")
  section9: {
    @UI.label("20. U.S. Citizen or Non-Citizen National?")
    isUsCitizenOrNational: Form.isUsCitizenOrNational;

    nonUsCitizenshipStatus: Form.nonUsCitizenshipStatus;
    permanentResidentByAward: Form.permanentResidentByAward;
  };
}
