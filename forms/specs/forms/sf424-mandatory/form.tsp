import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#questions/certification/index.tsp";

import "./examples.tsp";
import "./fragments.tsp";

using SimplerForms;

namespace Forms.SF424Mandatory;

@Meta.form(#{ id: "sf424-mandatory", formName: "SF424 Mandatory Form" })
@GrantsGov.form(#{
  legacyFormId: 712,
  shortFormName: "SF424_Mandatory_3_0",
  formVersion: "3.0",
  agencyCode: "SGG",
  ombNumber: "4040-0020",
  expirationDate: "2029-03-31",
})
@example(Examples.complete)
@example(Examples.minimum)
model SF424Mandatory {
  opportunity: MandatoryOpportunity;
  application: MandatoryApplication;
  applicant: MandatoryApplicant;
  project: MandatoryProject;
  contacts: MandatoryContacts;
  budget: MandatoryBudget;
  certification: Questions.Certifications.Certification;
  attachments?: MandatoryAttachments;
}
