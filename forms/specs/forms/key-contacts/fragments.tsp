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

// A contact person named for their role on the project: Key Contacts `RoleOnProject`. A
// `Person`, plus a free-text role and an affiliation, and the email is required.
@Meta.question(#{ id: "person/key-contact" })
@Meta.tag(Catalogue.Tag.person, Catalogue.Tag.role)
@UI.label("Key Contact")
@example(Examples.principalInvestigator)
@Validation.requiredPaths("email")
model KeyContact {
  /** Enter the individual's role on the project (e.g., project manager, fiscal contact). */
  @UI.label("Project Role")
  projectRole: Forms.KeyContacts.ProjectRole;

  ...Questions.People.Person;

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
