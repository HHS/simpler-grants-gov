import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";

import "./examples.tsp";
import "./fragments.tsp";

using SimplerForms;

namespace Forms.EPAKeyContacts;

// The data only: how an applicant is shown it is `EPAKeyContactsLayout`, in layout.tsp.
/** EPA KEY CONTACTS FORM, Grants.gov version 2.0. */
@Meta.form(#{ id: "epa-key-contacts", formName: "EPA KEY CONTACTS FORM" })
@Sgg.sync(#{ instructions: "50bf1880-18da-4a55-9956-57036ca5f468" })
@GrantsGov.form(#{
  legacyFormId: 674,
  shortFormName: "EPA_KeyContacts",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "2030-0020",
  expirationDate: "2029-02-28",
})
@example(Examples.form)
model EPAKeyContacts {
  /** Original awards and amendments will be sent to this individual for review and acceptance, unless otherwise indicated. */
  authorizedRepresentative?: Forms.EPAKeyContacts.EPAContact;

  /** Individual authorized to accept payments. */
  payee?: Forms.EPAKeyContacts.EPAContact;

  /** Individual from Sponsored Programs Office to contact concerning administrative matters (i.e., indirect cost rate computation, rebudgeting requests etc). */
  administrativeContact?: Forms.EPAKeyContacts.EPAContact;

  /** Individual responsible for the technical completion of the proposed work. */
  projectManager?: Forms.EPAKeyContacts.EPAContact;
}
