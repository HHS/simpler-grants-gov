import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/types/address.tsp";
import "#questions/types/attachment.tsp";

using SimplerForms;

namespace Forms.PerformanceSites;

/** Enter the congressional district as two state characters, a hyphen and three characters. */
@minLength(6)
@maxLength(6)
@pattern("^[A-Z0-9]{2}-[A-Za-z0-9]{3}$")
scalar CongressionalDistrict extends string;

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

@Sgg.sync(#{ instructions: "30e2d140-46b8-4fe0-b48c-48a5270ed118" })
@Meta.form(#{
  id: "performance-sites",
  formName: "PROJECT/PERFORMANCE SITE LOCATION(S)",
})
@GrantsGov.form(#{
  legacyFormId: 723,
  shortFormName: "PerformanceSite",
  formVersion: "4.0",
  agencyCode: "SGG",
  ombNumber: "4040-0010",
  expirationDate: "2029-08-31",
})
@example(
  #{
    primarySite: #{
      submittingAsIndividual: true,
      address: #{
        street1: "85 Walnut Lane",
        city: "Springfield",
        county: "Sangamon",
        state: Questions.Types.StateCode.IL,
        country: Questions.Types.CountryCode.USA,
        zipCode: "62701-1234",
      },
      congressionalDistrict: "IL-013",
    },
  },
  #{
    title: "Individual primary site",
    description: "Fictional individual applicant omits organization name and UEI. This illustrates the primary-site organization-unless-individual requirement, not a waiver for organization applicants.",
  }
)
@example(
  #{
    primarySite: #{
      submittingAsIndividual: false,
      organizationName: "Prairie Community Research Center",
      uei: "PCRA12345678",
      address: #{
        street1: "128 Oak Avenue",
        city: "Springfield",
        county: "Sangamon",
        state: Questions.Types.StateCode.IL,
        country: Questions.Types.CountryCode.USA,
        zipCode: "62701-1234",
        street2: "Suite 200",
      },
      congressionalDistrict: "IL-013",
    },
    additionalSites: #[
      #{
        submittingAsIndividual: false,
        organizationName: "Maple Community Research Centre",
        uei: "MCRC12345678",
        address: #{
          street1: "240 Maple Street",
          street2: "Suite 210",
          city: "Ottawa",
          province: "Ontario",
          country: Questions.Types.CountryCode.CAN,
          zipCode: "K1P 1J1",
        },
        congressionalDistrict: "00-000",
      }
    ],
  },
  #{
    title: "US primary site and Canadian partner",
    description: "Fictional US and Canadian partner sites show independent country, state/province and postal answers. Canada has Province without State; the US primary site has State without Province. No XML transformation or successful submission is implied.",
  }
)
@example(
  #{
    primarySite: #{
      submittingAsIndividual: false,
      organizationName: "Prairie Community Research Center",
      uei: "PCRA12345678",
      address: #{
        street1: "128 Oak Avenue",
        city: "Springfield",
        county: "Sangamon",
        state: Questions.Types.StateCode.IL,
        country: Questions.Types.CountryCode.USA,
        zipCode: "62701-1234",
        street2: "Suite 200",
      },
      congressionalDistrict: "IL-013",
    },
    additionalSites: #[
      #{
        submittingAsIndividual: false,
        organizationName: "Prairie Community Field Office",
        uei: "PCFO12345678",
        address: #{
          street1: "460 Cedar Street",
          city: "Springfield",
          county: "Sangamon",
          state: Questions.Types.StateCode.IL,
          country: Questions.Types.CountryCode.USA,
          zipCode: "62701-1234",
        },
        congressionalDistrict: "IL-013",
      }
    ],
  },
  #{
    title: "US primary site and field office",
    description: "Fictional research organization with two distinct US locations. ZIP+4 follows the DAT nine-digit guidance; no inapplicable Province or uploaded-file reference is supplied. Addresses and identifiers are illustrative, not verified delivery locations or registrations.",
  }
)
model PerformanceSites {
  @UI.label("Primary site")
  primarySite: PrimarySite;

  @doc("Add up to 299 additional project/performance site locations. Each entry has independent answers.")
  @UI.label("Additional site")
  @UI.widget(Rendering.Widget.CollapsibleFieldList)
  @maxItems(299)
  additionalSites?: Site[];

  @doc("Attach a file listing additional locations if more than 299 additional sites are needed.")
  @UI.label("Additional Location(s)")
  @UI.widget(Rendering.Widget.Attachment)
  additionalLocationsAttachment?: Questions.Types.Attachment;
}
