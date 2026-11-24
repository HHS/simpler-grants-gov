import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#questions/certification/index.tsp";

import "./examples.tsp";
import "./fragments.tsp";

using SimplerForms;

namespace Forms.SF424Research;

// The data only: how an applicant is shown it is in layout.tsp.
@Sgg.sync(#{
  instructions: "f6f56092-3948-4437-ab31-0650cd649f56",
  xml: "mapping",
})
@Meta.form(#{
  id: "sf424-r-r",
  formName: "Application for Federal Assistance (SF 424 R&R)",
})
@GrantsGov.form(#{
  legacyFormId: 768,
  shortFormName: "RR_SF424_5_0",
  formVersion: "5.0",
  agencyCode: "SGG",
  ombNumber: "4040-0001",
  expirationDate: "2029-01-31",
})
@example(Examples.revision)
@example(Examples.newApplication)
model ResearchCover {
  opportunity: ResearchOpportunity;
  application: ResearchApplication;
  applicant: ResearchApplicant;
  project: ResearchProject;
  contacts: ResearchContacts;
  budget: ResearchBudget;
  certification: Questions.Certifications.Certification;
  attachments?: ResearchAttachments;
}
