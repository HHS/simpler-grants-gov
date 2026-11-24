import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#forms/sf424-r-r/fragments.tsp";

import "./examples.tsp";
import "./fragments.tsp";

using SimplerForms;

namespace Forms.SF424ResearchMultiProject;

// The data only: how an applicant is shown it is in layout.tsp. Every element is optional.
@Meta.form(#{
  id: "sf424-r-r-multi-project-cover",
  formName: "SF-424 R&R Multi-Project Cover",
})
@GrantsGov.form(#{
  legacyFormId: 769,
  shortFormName: "RR_SF424_Multi_Project_Cover_4_0",
  formVersion: "4.0",
  agencyCode: "SGG",
  ombNumber: "4040-0001",
  expirationDate: "2029-01-31",
})
@example(Examples.empty)
@example(Examples.revision)
@example(Examples.component)
model MultiProjectCover {
  opportunity?: MultiProjectOpportunity;
  application?: MultiProjectApplication;
  applicant?: MultiProjectApplicant;
  project?: MultiProjectProject;
  contacts?: MultiProjectContacts;
  budget?: MultiProjectBudget;
  certification?: MultiProjectCertification;
  attachments?: Forms.SF424Research.ResearchAttachments;
}
