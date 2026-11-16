import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.KeyContacts;

// One Key Contacts section, as the hand-written SGG form has: the applicant organization
// name, then the list of contacts. Each contact's project role, title and affiliation come
// ahead of the name. The data keeps them in XSD order.
@UI.layout(KeyContacts)
model KeyContactsLayout {
  @UI.label("Key Contacts")
  section: {
    applicantOrganizationName: KeyContacts.applicantOrganizationName;

    /** You may enter up to four (4) Key Contacts. At least 1 (one) contact person is required. Additional contacts are optional. */
    @UI.label("Key Contact")
    @UI.field(KeyContacts.keyContacts)
    keyContacts: {
      projectRole: Forms.KeyContacts.KeyContact.projectRole;
      title: Forms.KeyContacts.KeyContact.title;
      organizationalAffiliation: Forms.KeyContacts.KeyContact.organizationalAffiliation;
      @UI.flatten name: Forms.KeyContacts.KeyContact.name;
      @UI.flatten address: Forms.KeyContacts.KeyContact.address;
      phone: Forms.KeyContacts.KeyContact.phone;
      fax: Forms.KeyContacts.KeyContact.fax;
      email: Forms.KeyContacts.KeyContact.email;
    };
  };
}
