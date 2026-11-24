import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.EPAKeyContacts;

// =============================================================================
// FORM LAYOUT
// =============================================================================

// The paper form's layout: one section per role, in official order.
@UI.layout(EPAKeyContacts)
model EPAKeyContactsLayout {
  @UI.label("Authorized Representative")
  @UI.field(EPAKeyContacts.authorizedRepresentative)
  authorizedRepresentative: EPAContactLayout;

  @UI.label("Payee")
  @UI.field(EPAKeyContacts.payee)
  payee: EPAContactLayout;

  @UI.label("Administrative Contact")
  @UI.field(EPAKeyContacts.administrativeContact)
  administrativeContact: EPAContactLayout;

  @UI.label("Project Manager")
  @UI.field(EPAKeyContacts.projectManager)
  projectManager: EPAContactLayout;
}

// =============================================================================
// CONTACT LAYOUT
// =============================================================================

/**
 * One EPA contact, without County or Province, which `globLib:ContactPersonDataTypeV3`
 * permits but neither the official PDF nor the existing SGG form asks. Relative to
 * `EPAContact`, so one model serves every role.
 */
model EPAContactLayout {
  @UI.flatten name: Forms.EPAKeyContacts.EPAContact.name;
  title: Forms.EPAKeyContacts.EPAContact.title;

  @UI.flatten
  @UI.field(Forms.EPAKeyContacts.EPAContact.address)
  address: EPAAddressLayout;

  phone: Forms.EPAKeyContacts.EPAContact.phone;
  fax: Forms.EPAKeyContacts.EPAContact.fax;
  email: Forms.EPAKeyContacts.EPAContact.email;
}

/** An EPA contact's address, which asks for Zip / Postal Code before Country, as the PDF does. */
model EPAAddressLayout {
  street1: Questions.People.PersonAddress.street1;
  street2: Questions.People.PersonAddress.street2;
  city: Questions.People.PersonAddress.city;
  @UI.omit county: Questions.People.PersonAddress.county;
  state: Questions.People.PersonAddress.state;
  @UI.omit province: Questions.People.PersonAddress.province;
  zipCode: Questions.People.PersonAddress.zipCode;
  country: Questions.People.PersonAddress.country;
}
