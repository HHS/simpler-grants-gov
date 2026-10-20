import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.EPAKeyContacts;

/**
 * One EPA contact: their title under a Role heading after the name, and no County or
 * Province, which `globLib:ContactPersonDataTypeV3` permits but neither the official PDF
 * nor the existing SGG form asks. Relative to `Person`, so one model serves every role;
 * `Whose` names the role in each group's description, as the DAT does: "the Payee's ".
 */
model EPAContact<Whose extends valueof string> {
  @doc("Enter ${Whose}name. First and last name are required.")
  name: Questions.People.Person.name;

  @doc("Enter ${Whose}position title.")
  @UI.label("Role")
  role: {
    title: Questions.People.Person.title;
  };

  @doc("Enter ${Whose}complete address.")
  address: Questions.People.Person.address;

  @doc("Enter ${Whose}phone number, fax number and email. Phone number is required.")
  @UI.label("Contact Information")
  contact: {
    phone: Questions.People.Person.phone;
    fax: Questions.People.Person.fax;
    email: Questions.People.Person.email;
  };

  @UI.omit county: Questions.People.Person.address::type.county;
  @UI.omit province: Questions.People.Person.address::type.province;
}

// The paper form's layout: one section per role, in official order.
@UI.layout(EPAKeyContacts)
model EPAKeyContactsLayout {
  @UI.label("Authorized Representative")
  @UI.field(EPAKeyContacts.authorizedRepresentative)
  authorizedRepresentative: EPAContact<"the Authorized Representative's ">;

  @UI.label("Payee")
  @UI.field(EPAKeyContacts.payee)
  payee: EPAContact<"the Payee's ">;

  @UI.label("Administrative Contact")
  @UI.field(EPAKeyContacts.administrativeContact)
  administrativeContact: EPAContact<"the Administrative Contact's ">;

  @UI.label("Project Manager")
  @UI.field(EPAKeyContacts.projectManager)
  projectManager: EPAContact<"the Project Manager's ">;
}
