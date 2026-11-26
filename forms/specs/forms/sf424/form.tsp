import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#questions/certification/index.tsp";

import "./examples.tsp";
import "./fragments.tsp";

using SimplerForms;
namespace Forms.SF424Regular;

// The data only: how an applicant is shown it is in layout.tsp.
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
  opportunity: SF424Opportunity;

  // Require the revision type here: it answers the application type, one level up.
  @Validation.requiredPathWhen(
    "revision.type",
    "applicationType",
    SF424ApplicationType.Revision
  )
  application: SF424Application;

  applicant: SF424Applicant;
  project: SF424Project;
  contacts: SF424Contacts;
  budget: SF424Budget;
  certification: Questions.Certifications.Certification;
}
