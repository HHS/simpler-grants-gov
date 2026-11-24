import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.NasaPIAndAOR;

// =============================================================================
// FORM LAYOUT
// =============================================================================

// The paper form's sections: the AOR, then the PI.
@UI.layout(NasaPIAndAOR)
model NasaPIAndAORLayout {
  @UI.label("Authorized Representative Name")
  @UI.field(NasaPIAndAOR.authorizedRepresentative)
  authorizedRepresentative: {
    @UI.flatten name: NasaAuthorizedRepresentative.name;
    nspiresUsername: NasaAuthorizedRepresentative.nspiresUsername;
  };

  @UI.label("Principal Investigator Name")
  @UI.field(NasaPIAndAOR.principalInvestigator)
  principalInvestigator: {
    @UI.flatten name: NasaPrincipalInvestigator.name;
    usGovernmentParticipation: NasaPrincipalInvestigator.usGovernmentParticipation;
    federalAgency: NasaPrincipalInvestigator.federalAgency;
    federalAgencyDollar: NasaPrincipalInvestigator.federalAgencyDollar;
    internationalParticipation: NasaPrincipalInvestigator.internationalParticipation;
  };
}
