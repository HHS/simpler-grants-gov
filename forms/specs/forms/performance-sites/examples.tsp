import "./form.tsp";

namespace Forms.PerformanceSites.Examples;

// =============================================================================
// US PRIMARY SITE AND FIELD OFFICE
// =============================================================================

const fieldOffice: PerformanceSites = #{
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
};

const fieldOfficeOptions = #{
  title: "US primary site and field office",
  description: "Fictional research organization with two distinct US locations. ZIP+4 follows the DAT nine-digit guidance; no inapplicable Province or uploaded-file reference is supplied. Addresses and identifiers are illustrative, not verified delivery locations or registrations.",
};

// =============================================================================
// US PRIMARY SITE AND CANADIAN PARTNER
// =============================================================================

const canadianPartner: PerformanceSites = #{
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
};

const canadianPartnerOptions = #{
  title: "US primary site and Canadian partner",
  description: "Fictional US and Canadian partner sites show independent country, state/province and postal answers. Canada has Province without State; the US primary site has State without Province. No XML transformation or successful submission is implied.",
};

// =============================================================================
// INDIVIDUAL PRIMARY SITE
// =============================================================================

const individualPrimarySite: PerformanceSites = #{
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
};

const individualPrimarySiteOptions = #{
  title: "Individual primary site",
  description: "Fictional individual applicant omits organization name and UEI. This illustrates the primary-site organization-unless-individual requirement, not a waiver for organization applicants.",
};
