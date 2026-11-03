import "#questions/person/index.tsp";

import "./form.tsp";

namespace Forms.EPAKeyContacts.Examples;

// =============================================================================
// FORM EXAMPLE
// =============================================================================

/** A complete form, used by the form's example. */
const form: EPAKeyContacts = #{
  authorizedRepresentative: Questions.People.Examples.usContact,
  payee: Questions.People.Examples.usContactNoEmail,
  administrativeContact: Questions.People.Examples.usContact,
  projectManager: Questions.People.Examples.internationalContact,
};
