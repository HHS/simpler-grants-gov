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
  authorizedRepresentative: EPAContactLayout<"the Authorized Representative's ">;

  @UI.label("Payee")
  @UI.field(EPAKeyContacts.payee)
  payee: EPAContactLayout<"the Payee's ">;

  @UI.label("Administrative Contact")
  @UI.field(EPAKeyContacts.administrativeContact)
  administrativeContact: EPAContactLayout<"the Administrative Contact's ">;

  @UI.label("Project Manager")
  @UI.field(EPAKeyContacts.projectManager)
  projectManager: EPAContactLayout<"the Project Manager's ">;
}

// =============================================================================
// CONTACT LAYOUT
// =============================================================================

/**
 * One EPA contact: their title under a Role heading after the name, and no County or
 * Province, which `globLib:ContactPersonDataTypeV3` permits but neither the official PDF
 * nor the existing SGG form asks. Relative to `EPAContact`, so one model serves every role;
 * `Whose` names the role in each group's description, as the DAT does: "the Payee's ".
 */
model EPAContactLayout<Whose extends valueof string> {
  @doc("Enter ${Whose}name. First and last name are required.")
  name: Forms.EPAKeyContacts.EPAContact.name;

  @doc("Enter ${Whose}position title.")
  @UI.label("Role")
  role: {
    title: Forms.EPAKeyContacts.EPAContact.title;
  };

  @doc("Enter ${Whose}complete address.")
  address: Forms.EPAKeyContacts.EPAContact.address;

  @doc("Enter ${Whose}phone number, fax number and email. Phone number is required.")
  @UI.label("Contact Information")
  contact: {
    phone: Forms.EPAKeyContacts.EPAContact.phone;
    fax: Forms.EPAKeyContacts.EPAContact.fax;
    email: Forms.EPAKeyContacts.EPAContact.email;
  };

  @UI.omit county: Forms.EPAKeyContacts.EPAContact.address::type.county;
  @UI.omit province: Forms.EPAKeyContacts.EPAContact.address::type.province;
}
