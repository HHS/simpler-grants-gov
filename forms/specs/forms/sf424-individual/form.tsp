import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "./fragments.tsp";
import "./examples.tsp";

using SimplerForms;

namespace Forms.SF424Individual;

/** Application for Federal Domestic Assistance — Individual, Grants.gov version2.0. */
@Meta.form(#{
  id: "sf424-individual",
  formName: "Application for Federal Domestic Assistance - Individual",
})
@GrantsGov.form(#{
  legacyFormId: 668,
  shortFormName: "SF424_Individual",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "4040-0005",
  expirationDate: "2029-01-31",
})
@example(Examples.nonCitizen)
@example(Examples.usCitizen)
model SF424Individual {
  @UI.label("Opportunity Information")
  opportunity: Opportunity;

  /** Completed by Grants.gov upon submission. */
  @UI.label("Date Received")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.currentDate)
  dateReceived?: plainDate;

  @UI.label("Applicant Information")
  applicant: Applicant;

  @UI.label("Project Information")
  project: Project;

  @UI.label("Certification")
  certification: Certification;
}
