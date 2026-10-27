import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#questions/research/index.tsp";

import "./examples.tsp";
import "./fragments.tsp";

using SimplerForms;

namespace Forms.NSFKeyPersonExpanded;

// The data only: how an applicant is shown it is in layout.tsp.
/** NSF Senior/Key Person Profile (Expanded), Grants.gov version 3.3. */
@Sgg.sync(#{ instructions: "bf8931e8-9209-4267-affd-6e86fbeaf421", xml: "mapping" })
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
  expirationDate: "2026-11-30",
})
@example(Examples.form)
model NSFKeyPersonExpanded {
  principalInvestigator: NSFPrincipalInvestigatorProfile;

  @maxItems(99)
  @UI.widget(Rendering.Widget.CollapsibleFieldList)
  seniorKeyPersons?: NSFSeniorKeyPersonProfile[];

  additionalProfiles?: Questions.Research.AdditionalProfiles;
  additionalBiographicalSketches?: Questions.Research.AdditionalBiographicalSketches;
  additionalCurrentPendingSupport?: Questions.Research.AdditionalCurrentPendingSupport;
  additionalCollaborators?: Questions.Research.AdditionalCollaborators;
  additionalSynergisticActivities?: Questions.Research.AdditionalSynergisticActivities;
}
