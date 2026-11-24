import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";

import "./examples.tsp";
import "./fragments.tsp";

using SimplerForms;

namespace Forms.NasaPIAndAOR;

// The data only: how an applicant is shown it is in layout.tsp.
/** NASA - PI and AOR Supplemental Data Sheet, Grants.gov version 1.0. */
@Sgg.sync(#{
  instructions: "d48111dd-7e7c-4e29-82f8-84d16a033937",
  xml: "mapping",
})
@Meta.form(#{
  id: "nasa-pi-and-aor",
  formName: "NASA - Principal Investigator and Authorized Representative Supplemental Data Sheet",
})
@GrantsGov.form(#{
  legacyFormId: 314,
  shortFormName: "Nasa_PIandAORSupplementalDataSheet",
  formVersion: "1.0",
  agencyCode: "SGG",
  ombNumber: "2700-0092",
  expirationDate: "2029-11-30",
})
@example(Examples.form)
model NasaPIAndAOR {
  authorizedRepresentative: NasaAuthorizedRepresentative;
  principalInvestigator: NasaPrincipalInvestigator;
}
