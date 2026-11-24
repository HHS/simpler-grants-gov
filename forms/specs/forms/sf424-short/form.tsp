import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#questions/certification/index.tsp";

import "./fragments.tsp";

using SimplerForms;

namespace Forms.SF424Short;

/** Application for Federal Domestic Assistance - Short Organizational. */
@Sgg.sync(#{
  instructions: "6350c220-e1c1-4f43-b7a3-04f68d679daa",
  xml: "mapping",
})
@Meta.form(#{
  id: "sf424-short",
  formName: "Application for Federal Domestic Assistance-Short Organizational (SF-424)",
})
@GrantsGov.form(#{
  legacyFormId: 711,
  shortFormName: "SF424_Short",
  formVersion: "3.0",
  agencyCode: "SGG",
  ombNumber: "4040-0003",
  expirationDate: "2028-07-31",
})
model SF424Short {
  opportunity: Forms.SF424Short.ShortOpportunity;

  // Make it optional: Grants.gov fills its only field on submission.
  application?: Forms.SF424Short.ShortApplication;

  applicant: Forms.SF424Short.ShortApplicant;
  project: Forms.SF424Short.ShortProject;
  contacts: Forms.SF424Short.ShortContacts;
  certification: Questions.Certifications.Certification;
}
