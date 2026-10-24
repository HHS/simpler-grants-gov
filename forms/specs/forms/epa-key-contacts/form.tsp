import "form-library-xml";
import "simpler-forms";

import "#forms/index.tsp";
import "#questions/person/index.tsp";

using SimplerForms;

namespace Forms.EPAKeyContacts;

// Each role is a `globLib:ContactPersonDataTypeV3`, i.e. a `Person`. The role is given by
// where the person sits in the form, so there is no EPA-specific person question.
//
// The data only: how an applicant is shown it is `EPAKeyContactsLayout`, in layout.tsp.
/** EPA KEY CONTACTS FORM, Grants.gov version 2.0. */
@Meta.form(#{ id: "epa-key-contacts", formName: "EPA KEY CONTACTS FORM" })
@GrantsGov.form(#{
  legacyFormId: 674,
  shortFormName: "EPA_KeyContacts",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "2030-0020",
  expirationDate: "2029-02-28",
})
@example(#{
  authorizedRepresentative: Questions.People.Examples.usContact,
  payee: Questions.People.Examples.usContactNoEmail,
  administrativeContact: Questions.People.Examples.usContact,
  projectManager: Questions.People.Examples.usContact,
})
model EPAKeyContacts {
  /** Original awards and amendments will be sent to this individual for review and acceptance, unless otherwise indicated. */
  authorizedRepresentative?: Questions.People.Person;

  /** Individual authorized to accept payments. */
  payee?: Questions.People.Person;

  /** Individual from Sponsored Programs Office to contact concerning administrative matters (i.e., indirect cost rate computation, rebudgeting requests etc). */
  administrativeContact?: Questions.People.Person;

  /** Individual responsible for the technical completion of the proposed work. */
  projectManager?: Questions.People.Person;
}
