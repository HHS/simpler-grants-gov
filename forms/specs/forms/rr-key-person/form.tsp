import "form-library-xml";
import "simpler-forms";

import "#forms/index.tsp";
import "#questions/research/index.tsp";

import "./profile.tsp";

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
})
@example(#{
  principalInvestigator: #{
    profile: Forms.RRKeyPerson.Examples.principalInvestigator,
  },
  seniorKeyPersons: #[#{ profile: Forms.RRKeyPerson.Examples.engineer }],
  additionalProfiles: "c5e7a9b1-2d4f-4a6b-9c8d-4f6a8b0c2e44",
})
model RRKeyPerson {
  principalInvestigator: RRKeyPersonEntry;

  @maxItems(7)
  @UI.widget(Rendering.Widget.CollapsibleFieldList)
  seniorKeyPersons?: RRKeyPersonEntry[];

  additionalProfiles?: Questions.Research.AdditionalProfiles;
  additionalBiographicalSketches?: Questions.Research.AdditionalBiographicalSketches;
  additionalCurrentPendingSupport?: Questions.Research.AdditionalCurrentPendingSupport;
}
