import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "./fragments.tsp";
import "./examples.tsp";

using SimplerForms;
namespace Forms.SF424Regular;

@Meta.form(#{
  id: "sf424",
  formName: "Application for Federal Assistance (SF-424)",
})
@GrantsGov.form(#{
  legacyFormId: 713,
  shortFormName: "SF424_4_0",
  formVersion: "4.0",
  agencyCode: "SGG",
  ombNumber: "4040-0004",
  expirationDate: "2029-03-31",
})
@example(Examples.nonprofit)
model SF424 {
  application: RegularApplication;
  applicant: RegularApplicant;
  contact: RegularContact;
  applicantType: RegularApplicantType;
  opportunity: RegularOpportunity;
  project: RegularProject;
  funding: RegularFunding;
  stateReview: RegularStateReview;
  debt: RegularDebt;
  certification: RegularCertification;
  authorizedRepresentative: RegularRepresentative;
}
