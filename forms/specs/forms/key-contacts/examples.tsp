import "./form.tsp";

namespace Forms.KeyContacts.Examples;

// =============================================================================
// FORM EXAMPLE
// =============================================================================

/** A complete form, used by the form's example. */
const form: KeyContacts = #{
  applicantOrganizationName: "Acme Corporation",
  keyContacts: #[
    principalInvestigator,
    projectManager
  ],
};

// =============================================================================
// SAMPLE KEY CONTACTS
// =============================================================================

const principalInvestigator: KeyContact = #{
  projectRole: "Principal Investigator",
  name: #{
    prefix: "Doctor",
    firstName: "Sue",
    middleName: "Sally",
    lastName: "Storm",
    suffix: "Esquire",
  },
  title: "Director",
  organizationalAffiliation: "Acme University",
  address: #{
    street1: "123 Main Street",
    street2: "Apt 123",
    city: "Placeville",
    state: Questions.Types.StateCode.WY,
    zipCode: "56789-1234",
    country: Questions.Types.CountryCode.USA,
  },
  phone: "1234567890",
  fax: "1112223333",
  email: "example@example.com",
};

const projectManager: KeyContact = #{
  projectRole: "Project Manager",
  name: #{ firstName: "Joe", lastName: "Smithers" },
  address: #{
    street1: "456 Rio",
    city: "Montevideo",
    province: "Montevideo",
    country: Questions.Types.CountryCode.URY,
  },
  phone: "1234567890",
  email: "person@place.com",
};
