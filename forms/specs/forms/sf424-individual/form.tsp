import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#questions/certification/index.tsp";
import "#questions/opportunity/index.tsp";

import "./examples.tsp";
import "./fragments.tsp";

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
  opportunity: SF424IndividualOpportunity;
  application?: SF424IndividualApplication;
  applicant: SF424IndividualApplicant;
  project: SF424IndividualProject;
  contacts: SF424IndividualContacts;
  certification: Questions.Certifications.Certification;
}
