import "simpler-forms";

import "#forms/index.tsp";
import "#questions/person/index.tsp";

using SimplerForms;

namespace Forms.EPAKeyContacts;

// =============================================================================
// PERSON
// =============================================================================

// `globLib:ContactPersonDataTypeV3`. Every EPA role is one, and the role is given by where the
// person sits in the form.
/** A person and how to reach them. */
model EPAContact {
  /** Enter the person's name. First and last name are required. */
  @UI.label("Name")
  name: Questions.People.PersonName;

  /** Enter the position title. */
  @UI.label("Title")
  title?: Questions.People.PersonTitle;

  /** Enter the person's complete address. */
  @UI.label("Address")
  address: Questions.People.PersonAddress;

  // `ContactPersonDataTypeV3` makes the phone optional; EPA requires it.
  /** Enter the phone number. */
  @UI.label("Phone Number")
  phone: Questions.People.PersonPhoneNumber;

  /** Enter the fax number. */
  @UI.label("Fax Number")
  fax?: Questions.People.PersonFaxNumber;

  /** Enter the email address. */
  @UI.label("Email")
  email?: Questions.People.PersonEmail;
}
