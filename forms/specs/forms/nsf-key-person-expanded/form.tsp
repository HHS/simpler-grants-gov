import "form-library-xml";
import "simpler-forms";

import "#forms/index.tsp";
import "#questions/research/index.tsp";

import "./profile.tsp";

using SimplerForms;

namespace Forms.NSFKeyPersonExpanded;

// The data only: how an applicant is shown it is in layout.tsp.
/** NSF Senior/Key Person Profile (Expanded), Grants.gov version 3.3. */
@Meta.form(#{
  id: "nsf-key-person-expanded",
  formName: "NSF Senior/Key Person Profile (Expanded)",
})
@GrantsGov.form(#{
  legacyFormId: 828,
  shortFormName: "NSF_KeyPersonExpanded",
  formVersion: "3.3",
  agencyCode: "SGG",
  ombNumber: "3145-0058",
})
@example(#{
  principalInvestigator: #{
    profile: Forms.NSFKeyPersonExpanded.Examples.principalInvestigator,
  },
  seniorKeyPersons: #[
    #{ profile: Forms.NSFKeyPersonExpanded.Examples.engineer }
  ],
})
model NSFKeyPersonExpanded {
  principalInvestigator: NSFPrincipalInvestigator;

  @maxItems(99)
  @UI.widget(Rendering.Widget.CollapsibleFieldList)
  seniorKeyPersons?: NSFSeniorKeyPerson[];

  additionalProfiles?: Questions.Research.AdditionalProfiles;
  additionalBiographicalSketches?: Questions.Research.AdditionalBiographicalSketches;
  additionalCurrentPendingSupport?: Questions.Research.AdditionalCurrentPendingSupport;
  additionalCollaborators?: Questions.Research.AdditionalCollaborators;
  additionalSynergisticActivities?: Questions.Research.AdditionalSynergisticActivities;
}
