import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.SbirSttrInformation;

@UI.layout(Form)
model Layout {
  @UI.label("Agency and small business identification")
  application: {
    agency: Form.agency;
    otherAgency: Form.otherAgency;
    sbcControlId: Form.sbcControlId;
    programType: Form.programType;
    applicationType: Form.applicationType;
    phaseILetterOfIntentNumber: Form.phaseILetterOfIntentNumber;
    agencyTopicSubtopic: Form.agencyTopicSubtopic;
  };

  @UI.label("Small business eligibility and ownership")
  eligibility: {
    eligibilityCertification: Form.eligibilityCertification;
    anticipatedPersonnel: Form.anticipatedPersonnel;
    majorityVentureCapitalOwned: Form.majorityVentureCapitalOwned;
    facultyOrStudentOwned: Form.facultyOrStudentOwned;
  };

  @UI.label("Project and federal assistance questions")
  project: {
    federalSubcontractsIncluded: Form.federalSubcontractsIncluded;
    laboratoryOrAgencyNames: Form.laboratoryOrAgencyNames;
    hubZoneLocated: Form.hubZoneLocated;
    researchEntirelyInUnitedStates: Form.researchEntirelyInUnitedStates;
    outsideUnitedStatesExplanation: Form.outsideUnitedStatesExplanation;
    equivalentFederalWork: Form.equivalentFederalWork;
    equivalentWorkAgencies: Form.equivalentWorkAgencies;
    disclosurePermitted: Form.disclosurePermitted;
    tabaFundsRequested: Form.tabaFundsRequested;
    commercializationPlan: Form.commercializationPlan;
  };

  @UI.label("SBIR questions")
  sbir: {
    phaseIIAwardsReceived: Form.phaseIIAwardsReceived;
    commercializationHistory: Form.commercializationHistory;
    principalInvestigatorPrimaryEmployment: Form.principalInvestigatorPrimaryEmployment;
  };

  @UI.label("STTR questions")
  sttr: {
    appointmentAndMinimumEffortCertified: Form.appointmentAndMinimumEffortCertified;
    smallBusinessAndInstitutionWorkSharesCertified: Form.smallBusinessAndInstitutionWorkSharesCertified;
    researchPartnerUei: Form.researchPartnerUei;
  };
}
