import "simpler-forms";

import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/index.tsp";

import "./examples.tsp";

using SimplerForms;

namespace Forms.KeyContacts;

// =============================================================================
// KEY CONTACT
// =============================================================================

// A contact person named for their role on the project: Key Contacts `RoleOnProject`.
@Meta.question(#{ id: "person/key-contact" })
@Meta.tag(Catalogue.Tag.person, Catalogue.Tag.role)
@UI.label("Key Contact")
@example(Examples.principalInvestigator)
model KeyContact {
  /** Enter the individual's role on the project (e.g., project manager, fiscal contact). */
  @UI.label("Project Role")
  projectRole: Forms.KeyContacts.ProjectRole;

  /** Enter the person's name. First and last name are required. */
  @UI.label("Name")
  name: Questions.People.PersonName;

  /** Enter the position title. */
  @UI.label("Title")
  title?: Questions.People.PersonTitle;

  /** Enter the person's complete address. */
  @UI.label("Address")
  address: Questions.Types.AddressZipPlusFour;

  /** Enter the phone number. */
  @UI.label("Phone Number")
  phone: Questions.People.PersonPhoneNumber;

  /** Enter the fax number. */
  @UI.label("Fax Number")
  fax?: Questions.People.PersonFaxNumber;

  /** Enter the email address. */
  @UI.label("Email")
  email: Questions.People.PersonEmail;

  /** Enter the contact's organizational affiliation. */
  @UI.label("Organizational Affiliation")
  organizationalAffiliation?: Questions.Organizations.OrgName;
}

// =============================================================================
// ANSWER TYPES
// =============================================================================

/** Enter the key contact's free-text role on this project. */
@Meta.question(#{ id: "person/key-contact/project-role" })
@Meta.role(ResponseRole.applicantInput)
@Meta.tag(Catalogue.Tag.person, Catalogue.Tag.role)
@minLength(1)
@maxLength(45)
scalar ProjectRole extends string;
