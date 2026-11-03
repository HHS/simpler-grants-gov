import "./form.tsp";

namespace Forms.NSFKeyPersonExpanded.Examples;

// =============================================================================
// FORM EXAMPLE
// =============================================================================

/** A complete form, used by the form's example. */
const form: NSFKeyPersonExpanded = #{
  principalInvestigator: principalInvestigator,
  seniorKeyPersons: #[engineer],
};

// =============================================================================
// SAMPLE PEOPLE
// =============================================================================

const principalInvestigator: NSFPrincipalInvestigatorProfile = #{
  name: #{ prefix: "Dr.", firstName: "Maria", lastName: "Chen" },
  title: "Professor of Biology",
  organizationName: "University of Wisconsin-Madison",
  department: "Department of Biology",
  address: #{
    street1: "1200 University Avenue",
    city: "Madison",
    state: Questions.Types.StateCode.WI,
    zipCode: "53706-1380",
    country: Questions.Types.CountryCode.USA,
  },
  phone: "6085550100",
  email: "maria.chen@example.edu",
  projectRole: NSFProjectRole.pdPi,
  nsfId: "000123456",
  biographicalSketch: "3f1c2a9e-5b7d-4c1e-9a2b-1d4e6f8a0b11",
  currentPendingSupport: "7a2e4c6b-8d1f-4a3e-b5c7-2e4f6a8b0c22",
  collaborators: "b4d6f8a0-1c3e-4f5a-8b7c-3e5f7a9b1d33",
  synergisticActivities: "c5e7a9b1-2d4f-4a6b-9c8d-4f6a8b0c2e44",
};

const engineer: NSFSeniorKeyPersonProfile = #{
  name: #{ prefix: "Mr.", firstName: "Tom", lastName: "Okafor" },
  title: "Research Engineer",
  organizationUei: "ABCDEFGH1234",
  department: "Department of Engineering",
  address: #{
    street1: "25 King's Parade",
    city: "Cambridge",
    province: "Cambridgeshire",
    zipCode: "CB2 1ST",
    country: Questions.Types.CountryCode.GBR,
  },
  phone: "6085550100",
  email: "tom.okafor@example.ac.uk",
  projectRole: NSFProjectRole.otherSeniorPersonnel,
  biographicalSketch: "3f1c2a9e-5b7d-4c1e-9a2b-1d4e6f8a0b11",
  currentPendingSupport: "7a2e4c6b-8d1f-4a3e-b5c7-2e4f6a8b0c22",
  collaborators: "b4d6f8a0-1c3e-4f5a-8b7c-3e5f7a9b1d33",
  synergisticActivities: "c5e7a9b1-2d4f-4a6b-9c8d-4f6a8b0c2e44",
};
