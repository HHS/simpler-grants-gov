import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.Phs398CareerDevelopmentAwardSupplemental;

@UI.layout(Form)
model FormLayout {
  /** Attach an Introduction to Application for Resubmission and Revision applications. */
  @UI.label("Introduction")
  section1: {
    introductionToApplication: Form.introductionToApplication;
  };

  @UI.label("Candidate Section")
  section2: {
    candidateInformationAndGoals: Form.candidateInformationAndGoals;
  };

  /** Research Strategy is required. Include the Progress Report Publication List for Renewal applications. It is optional for Resubmission. */
  @UI.label("Research Plan Section")
  section3: {
    specificAims: Form.specificAims;
    researchStrategy: Form.researchStrategy;
    progressReportPublicationList: Form.progressReportPublicationList;
    responsibleConductOfResearch: Form.responsibleConductOfResearch;
  };

  @UI.label("Other Candidate Information Section")
  section4: {
    mentoringPlan: Form.mentoringPlan;
  };

  @UI.label("Mentor, Co-Mentor, Consultant, Collaborators Section")
  section5: {
    statementsOfSupport: Form.statementsOfSupport;
    lettersOfSupport: Form.lettersOfSupport;
  };

  @UI.label("Environment and Institutional Commitment to the Candidate Section")
  section6: {
    institutionalEnvironment: Form.institutionalEnvironment;
    institutionalCommitment: Form.institutionalCommitment;
    candidatesContribution: Form.candidatesContribution;
  };

  /** Include Vertebrate Animals if you answered Yes to the animals-used question on R&R Other Project Information. */
  @UI.label("Other Research Plan Section")
  section7: {
    vertebrateAnimals: Form.vertebrateAnimals;
    selectAgentResearch: Form.selectAgentResearch;
    consortiumContractualArrangements: Form.consortiumContractualArrangements;
    resourceSharingPlans: Form.resourceSharingPlans;
    otherPlans: Form.otherPlans;
    keyBiologicalAndOrChemicalResources: Form.keyBiologicalAndOrChemicalResources;
  };

  @UI.label("Appendix")
  section8: {
    appendix: Form.appendix;
  };

  @UI.label("Citizenship")
  section9: {
    isUsCitizenOrNational: Form.isUsCitizenOrNational;
    nonUsCitizenshipStatus: Form.nonUsCitizenshipStatus;
    permanentResidentByAward: Form.permanentResidentByAward;
  };
}
