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
  authorizedRepresentative: EPAContact;

  @UI.label("Payee")
  @UI.field(EPAKeyContacts.payee)
  payee: EPAContact;

  @UI.label("Administrative Contact")
  @UI.field(EPAKeyContacts.administrativeContact)
  administrativeContact: EPAContact;

  @UI.label("Project Manager")
  @UI.field(EPAKeyContacts.projectManager)
  projectManager: EPAContact;
}

// =============================================================================
// CONTACT LAYOUT
// =============================================================================

/**
 * One EPA contact, without County or Province, which `globLib:ContactPersonDataTypeV3`
 * permits but neither the official PDF nor the existing SGG form asks. Relative to
 * `Person`, so one model serves every role.
 */
model EPAContact {
  @UI.flatten name: Questions.People.Person.name;
  title: Questions.People.Person.title;
  @UI.flatten address: Questions.People.Person.address;
  phone: Questions.People.Person.phone;
  fax: Questions.People.Person.fax;
  email: Questions.People.Person.email;

  @UI.omit county: Questions.People.Person.address::type.county;
  @UI.omit province: Questions.People.Person.address::type.province;
}
