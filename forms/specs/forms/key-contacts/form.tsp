import "simpler-forms";

import "#forms/index.tsp";
import "#questions/organization/index.tsp";

import "./key-contact.tsp";

using SimplerForms;

namespace Forms.KeyContacts;

/** KEY CONTACTS (Grants.gov FID 683, v2.0) */
@Meta.form(#{ id: "key-contacts", formName: "KEY CONTACTS" })
@example(#{
  applicantOrganizationName: "Acme Corporation",
  keyContacts: #[
    Forms.KeyContacts.Examples.principalInvestigator,
    Forms.KeyContacts.Examples.projectManager
  ],
})
model KeyContacts {
  /** Enter the legal name of the applicant that will undertake the assistance activity. This field is required. */
  @UI.label("Applicant Organization Name")
  applicantOrganizationName: Questions.Organizations.OrgName;

  /** You may enter up to four (4) Key Contacts. At least 1 (one) contact person is required. Additional contacts are optional. */
  @UI.label("Key Contacts")
  @minItems(1)
  @maxItems(4)
  @UI.widget(Rendering.Widget.CollapsibleFieldList)
  keyContacts: Forms.KeyContacts.KeyContact[];
}
