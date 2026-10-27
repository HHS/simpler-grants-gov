import "form-library-xml";
import "simpler-forms";

import "#forms/index.tsp";
import "#questions/research/index.tsp";

import "./profile.tsp";

using SimplerForms;

namespace Forms.RRKeyPersonExpanded;

// The data only: how an applicant is shown it is in layout.tsp.
/** Research and Related Senior/Key Person Profile (Expanded), Grants.gov version 4.0. */
@Meta.form(#{
  id: "rr-key-person-expanded",
  formName: "RESEARCH & RELATED Senior/Key Person Profile (Expanded)",
})
@GrantsGov.form(#{
  legacyFormId: 774,
  shortFormName: "RR_KeyPersonExpanded",
  formVersion: "4.0",
  agencyCode: "SGG",
  ombNumber: "4040-0001",
  expirationDate: "2029-01-31",
})
@example(#{
  principalInvestigator: #{
    profile: Forms.RRKeyPersonExpanded.Examples.principalInvestigator,
  },
  seniorKeyPersons: #[
    #{ profile: Forms.RRKeyPersonExpanded.Examples.engineer }
  ],
})
model RRKeyPersonExpanded {
  // The XSD makes every sketch optional; the form requires the PD/PI's, as the DAT does.
  @Validation.requiredPaths("profile.biographicalSketch")
  principalInvestigator: RRExpandedKeyPersonEntry;

  @maxItems(99)
  @UI.widget(Rendering.Widget.CollapsibleFieldList)
  seniorKeyPersons?: RRExpandedKeyPersonEntry[];

  additionalProfiles?: Questions.Research.AdditionalProfiles;
  additionalBiographicalSketches?: Questions.Research.AdditionalBiographicalSketches;
  additionalCurrentPendingSupport?: Questions.Research.AdditionalCurrentPendingSupport;
}
