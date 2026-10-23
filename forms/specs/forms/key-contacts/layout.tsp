import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.KeyContacts;

// The paper form's sections, with each contact's project role, title and affiliation
// grouped under a Role heading ahead of the name. The data keeps them in XSD order.
@UI.layout(KeyContacts)
model KeyContactsLayout {
  /** Enter the legal name of the applicant organization. */
  @UI.label("Applicant Information")
  applicant: {
    applicantOrganizationName: KeyContacts.applicantOrganizationName;
  };

  /** You may enter up to four (4) key contacts. At least one (1) contact person is required; additional contacts are optional. */
  @UI.label("Contact Information")
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
}
