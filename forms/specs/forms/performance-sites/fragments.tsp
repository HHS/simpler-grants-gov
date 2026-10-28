import "simpler-forms";

import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/types/address.tsp";

using SimplerForms;

namespace Forms.PerformanceSites;

// =============================================================================
// SITES
// =============================================================================

// A site is a domain object, not a heading added to the answer model. Primary and
// additional occurrences share the body while retaining their different obligations.
model Site {
  @doc("Select if submitting application as an individual and not on behalf of or representing any organization.")
  @UI.label("I am submitting an application as an individual, and not on behalf of a company, state, local or tribal government, academia, or other type of organization.")
  @UI.widget(Rendering.Widget.Checkbox)
  submittingAsIndividual?: boolean;

  @doc("Indicate the organization name of the site where the work will be performed.")
  @UI.label("Organization Name")
  organizationName?: Questions.Organizations.OrgName;

  @doc("Enter the UEI associated with the organization where the project will be performed. This field is optional.")
  @UI.label("UEI")
  uei?: Questions.Organizations.OrgUei;

  address: Questions.Types.Address;

  @doc("Enter the Congressional District in the format: 2 character State Abbreviation - 3 character District Number. Examples: CA-005, MD-all, US-all, 00-000. Required if the site is in the United States.")
  @UI.label("Project/Performance Site Congressional District")
  @Validation.requiredWhenPath(
    "address.country",
    Questions.Types.CountryCode.USA
  )
  congressionalDistrict?: CongressionalDistrict;
}

// Existing SGG requires the organization unless the individual flag is explicitly true,
// including while that flag is absent. Keep this one rule in the definition with the
// standard JSON Schema decorator; equality-only requiredWhen cannot express absence.
@TypeSpec.JsonSchema.extension(
  "allOf",
  #[
    #{
      `if`: #{
        properties: #{ submittingAsIndividual: #{ `const`: true } },
        required: #["submittingAsIndividual"],
      },
      `else`: #{ required: #["organizationName"] },
    }
  ]
)
model PrimarySite {
  ...Site;
}

// =============================================================================
// ANSWER TYPES
// =============================================================================

/** Enter the congressional district as two state characters, a hyphen and three characters. */
@minLength(6)
@maxLength(6)
@pattern("^[A-Z0-9]{2}-[A-Za-z0-9]{3}$")
scalar CongressionalDistrict extends string;
