import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.FNS906;
@UI.layout(FNS906Questionnaire)
model FNS906QuestionnaireLayout {
  @UI.label("Organization")
  @doc("View Burden Statement\n\nUNITED STATES DEPARTMENT OF AGRICULTURE \n\nFood and Nutrition Service\n\nOMB APPROVED NO. 0584-0512\n Expiration Date: 07/31/2025 \n\nGRANT PROGRAM ACCOUNTING SYSTEM & FINANCIAL  CAPABILITY QUESTIONNAIRE\n\nPURPOSE\n\nRecipients of Federal funds must maintain adequate accounting systems that meet the criteria outlined in 2 CFR §200.302 Standards for Financial and Program Management. The responses to this questionnaire are used to assist in the Food and Nutrition Service Agency’s (FNS) evaluation of your accounting system to ensure the adequate, appropriate, and transparent use of Federal funds. Failure to comply with the criteria outlined in the regulations above may preclude your organization from receiving an award. This form applies to FNS’ competitive and noncompetitive grant programs.\n\nORGANIZATION INFORMATION")
  section0: {
    organizationName: FNS906Questionnaire.organizationName;
    organizationUei: FNS906Questionnaire.organizationUei;
  };

  @UI.label("Accounting system and financial controls")
  @doc("FINANCIAL STABILITY AND QUALITY OF MANAGMENT SYSTEMS\n\nRequirement\n\nYes\n\nNo")
  section1: {
    federalAward: FNS906Questionnaire.federalAward;
    accountingSoftware: FNS906Questionnaire.accountingSoftware;
    programFunds: FNS906Questionnaire.programFunds;
    dedicatedMonitoring: FNS906Questionnaire.dedicatedMonitoring;
    separateDuties: FNS906Questionnaire.separateDuties;
    allocateEffort: FNS906Questionnaire.allocateEffort;
    managementSystem: FNS906Questionnaire.managementSystem;
  };

  @UI.label("Audit history")
  @doc("AUDIT REPORTS AND FINDINGS\n\nRequirement\n\nYes\n\nNo")
  section2: {
    audited: FNS906Questionnaire.audited;
    qualifiedOpinion: FNS906Questionnaire.qualifiedOpinion;
    materialWeakness: FNS906Questionnaire.materialWeakness;
    significantDeficiency: FNS906Questionnaire.significantDeficiency;
  };

  @UI.label("Additional information") section3: {
    hyperlink: FNS906Questionnaire.hyperlink;
    additionalInformation: FNS906Questionnaire.additionalInformation;
  };

  @UI.label("Authorized representative and submission")
  @doc("APPLICANT CERTIFICATION\n\nI certify that the above information is complete and correct to the best of my knowledge.\n\n")
  section4: {
    signature: FNS906Questionnaire.signature;
    signatureDate: FNS906Questionnaire.signatureDate;
    authorizedRepresentative: FNS906Questionnaire.authorizedRepresentative;
    phone: FNS906Questionnaire.phone;
    email: FNS906Questionnaire.email;
  };
}
