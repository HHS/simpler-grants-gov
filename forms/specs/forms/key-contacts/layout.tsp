import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.KeyContacts;

// One Key Contacts section, as the hand-written SGG form has: the applicant organization
// name, then the list of contacts. Each contact's project role, title and affiliation are
// grouped under a Role heading ahead of the name. The data keeps them in XSD order.
@UI.layout(KeyContacts)
model KeyContactsLayout {
  @UI.label("Key Contacts")
  section: {
    applicantOrganizationName: KeyContacts.applicantOrganizationName;

    /** You may enter up to four (4) Key Contacts. At least 1 (one) contact person is required. Additional contacts are optional. */
    @UI.label("Key Contact")
    @UI.field(KeyContacts.keyContacts)
    keyContacts: {
      /** Enter the contact's role on the project, title and organizational affiliation. */
      @UI.label("Role")
      role: {
        projectRole: Forms.KeyContacts.KeyContact.projectRole;
        title: Forms.KeyContacts.KeyContact.title;
        organizationalAffiliation: Forms.KeyContacts.KeyContact.organizationalAffiliation;
      };

      name: Forms.KeyContacts.KeyContact.name;
      address: Forms.KeyContacts.KeyContact.address;

      /** Enter the contact's phone, fax and email. Phone and email are required. */
      @UI.label("Contact Information")
      contact: {
        phone: Forms.KeyContacts.KeyContact.phone;
        fax: Forms.KeyContacts.KeyContact.fax;
        email: Forms.KeyContacts.KeyContact.email;
      };
    };
  };
}
