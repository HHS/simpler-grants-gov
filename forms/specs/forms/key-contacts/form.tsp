import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#questions/organization/index.tsp";

import "./key-contact.tsp";

using SimplerForms;

namespace Forms.KeyContacts;

/** KEY CONTACTS, Grants.gov version 2.0. */
@Meta.form(#{ id: "key-contacts", formName: "KEY CONTACTS" })
@Sgg.sync(#{ instructions: "b3ce463f-1f42-4444-90c6-1f1d2c39ad83" })
@GrantsGov.form(#{
  legacyFormId: 683,
  shortFormName: "Key_Contacts",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "4040-0010",
  expirationDate: "2029-08-31",
})
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

  /** Enter between 1 and 4 key contacts and their role on the project. */
  @UI.label("Key Contacts")
  @minItems(1)
  @maxItems(4)
  @UI.widget(Rendering.Widget.CollapsibleFieldList)
  keyContacts: Forms.KeyContacts.KeyContact[];
}
