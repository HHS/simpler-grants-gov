import "./form.tsp";
import "./fragments.tsp";

namespace Forms.NasaPIAndAOR.Examples;

// =============================================================================
// FORM EXAMPLE
// =============================================================================

/** A complete form, used by the form's example. */
const form: NasaPIAndAOR = #{
  authorizedRepresentative: #{
    name: #{ prefix: "Ms.", firstName: "Alicia", lastName: "Reyes" },
    nspiresUsername: "areyes",
  },
  principalInvestigator: #{
    name: #{ prefix: "Dr.", firstName: "Maria", lastName: "Chen" },
    usGovernmentParticipation: true,
    federalAgency: NasaFederalAgency.noaa,
    federalAgencyDollar: "125000.00",
    internationalParticipation: false,
  },
};
