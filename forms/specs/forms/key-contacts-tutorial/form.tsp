import "form-library-xml";
import "simpler-forms";

import "#forms/index.tsp";
import "#questions/person/index.tsp";

using SimplerForms;

namespace Forms.KeyContactsTutorial;

/** KEY CONTACTS, rebuilt for the form library tutorial. */
@Meta.form(#{ id: "key-contacts-tutorial", formName: "KEY CONTACTS (TUTORIAL)" })
@GrantsGov.form(#{
  legacyFormId: 683,
  shortFormName: "Key_Contacts_Tutorial",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "4040-0010",
})
model KeyContactsTutorial {
  /** Enter the legal name of the applicant that will undertake the assistance activity. This field is required. */
  @UI.label("Applicant Organization Name")
  @minLength(1)
  @maxLength(60)
  applicantOrganizationName: string;

  @UI.label("Key Contacts")
  @minItems(1)
  @maxItems(4)
  keyContacts: TutorialKeyContact[];
}

// Person makes email optional; Key Contacts requires it. Only a question can say so.
/** One key contact: a project role and an affiliation around the question bank's `Person`. */
@Meta.question(#{ id: "person/tutorial-key-contact" })
@Meta.tag(Catalogue.Tag.person, Catalogue.Tag.role)
@Validation.requiredPaths("email")
model TutorialKeyContact {
  /** Enter the project role of the contact person (e.g., project manager, fiscal contact). Additional contacts are optional. */
  @UI.label("Contact 1 Project Role")
  @minLength(1)
  @maxLength(45)
  projectRole: string;

  ...Questions.People.Person;

  /** Enter the Organizational Affiliation of the person to contact on matters related to this application. */
  @UI.label("Organizational Affiliation")
  @minLength(1)
  @maxLength(60)
  organizationalAffiliation?: string;
}
