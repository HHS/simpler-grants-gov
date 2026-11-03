import "form-library-xml";
import "simpler-forms";

import "#forms/index.tsp";
import "#questions/research/index.tsp";

import "./examples.tsp";
import "./fragments.tsp";

using SimplerForms;

namespace Forms.RRKeyPerson;

// The data only: how an applicant is shown it is in layout.tsp.
/** Research & Related Senior/Key Person Profile, Grants.gov version 3.0. */
@Meta.form(#{
  id: "rr-key-person",
  formName: "RESEARCH & RELATED Senior/Key Person Profile",
})
@GrantsGov.form(#{
  legacyFormId: 772,
  shortFormName: "RR_KeyPerson",
  formVersion: "3.0",
  agencyCode: "SGG",
  ombNumber: "4040-0001",
  expirationDate: "2029-01-31",
})
@example(Examples.form)
model RRKeyPerson {
  principalInvestigator: RRKeyPersonProfile;

  @maxItems(7)
  @UI.widget(Rendering.Widget.CollapsibleFieldList)
  seniorKeyPersons?: RRKeyPersonProfile[];

  additionalProfiles?: Questions.Research.AdditionalProfiles;
  additionalBiographicalSketches?: Questions.Research.AdditionalBiographicalSketches;
  additionalCurrentPendingSupport?: Questions.Research.AdditionalCurrentPendingSupport;
}
