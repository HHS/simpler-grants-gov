import "./form.tsp";
import "./fragments.tsp";

namespace Forms.EPAKeyContacts.Examples;

// =============================================================================
// FORM EXAMPLE
// =============================================================================

/** A complete form, used by the form's example. */
const form: EPAKeyContacts = #{
  authorizedRepresentative: usContact,
  payee: usContactNoEmail,
  administrativeContact: usContact,
  projectManager: internationalContact,
};

// =============================================================================
// PEOPLE
// =============================================================================

const usContact: Forms.EPAKeyContacts.EPAContact = #{
  name: #{ prefix: "Ms.", firstName: "Alicia", lastName: "Reyes" },
  title: "Executive Director",
  address: #{
    street1: "100 Grant Avenue",
    city: "Denver",
    state: Questions.Types.StateCode.CO,
    zipCode: "80202-1234",
    country: Questions.Types.CountryCode.USA,
  },
  phone: "3035550100",
  email: "alicia.reyes@example.org",
};

const usContactNoEmail: Forms.EPAKeyContacts.EPAContact = #{
  name: #{ firstName: "Marcus", lastName: "Lee" },
  title: "Controller",
  address: #{
    street1: "100 Grant Avenue",
    street2: "Suite 400",
    city: "Denver",
    state: Questions.Types.StateCode.CO,
    zipCode: "80202-1234",
    country: Questions.Types.CountryCode.USA,
  },
  phone: "3035550101",
  fax: "3035550199",
};

const internationalContact: Forms.EPAKeyContacts.EPAContact = #{
  name: #{ prefix: "Dr.", firstName: "Tom", lastName: "Okafor", suffix: "PhD" },
  title: "Lead Scientist",
  address: #{
    street1: "456 Rio",
    city: "Montevideo",
    province: "Montevideo",
    country: Questions.Types.CountryCode.URY,
  },
  phone: "1234567890",
  email: "tom.okafor@example.edu",
};
