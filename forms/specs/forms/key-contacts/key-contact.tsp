import "simpler-forms";

import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/index.tsp";

using SimplerForms;

namespace Forms.KeyContacts;

/** Enter the key contact's free-text role on this project. */
@Meta.question(#{ id: "person/key-contact/project-role" })
@Meta.role(ResponseRole.applicantInput)
@Meta.tag(Catalogue.Tag.person, Catalogue.Tag.role)
@minLength(1)
@maxLength(45)
scalar ProjectRole extends string;

// A contact person named for their role on the project: Key Contacts `RoleOnProject`. A
// `Person`, plus a free-text role and an affiliation, and the email is required.
@Meta.question(#{ id: "person/key-contact" })
@Meta.tag(Catalogue.Tag.person, Catalogue.Tag.role)
@UI.label("Key Contact")
@example(Forms.KeyContacts.Examples.principalInvestigator)
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

/** Sample key contacts, type-checked against `KeyContact` and reused by the form's example. */
namespace Examples {
  const principalInvestigator: Forms.KeyContacts.KeyContact = #{
    projectRole: "Principal Investigator",
    name: #{
      prefix: "Doctor",
      firstName: "Sue",
      middleName: "Sally",
      lastName: "Storm",
      suffix: "Esquire",
    },
    title: "Director",
    organizationalAffiliation: "Acme University",
    address: #{
      street1: "123 Main Street",
      street2: "Apt 123",
      city: "Placeville",
      state: Questions.Types.StateCode.WY,
      zipCode: "56789-1234",
      country: Questions.Types.CountryCode.USA,
    },
    phone: "1234567890",
    fax: "1112223333",
    email: "example@example.com",
  };

  const projectManager: Forms.KeyContacts.KeyContact = #{
    projectRole: "Project Manager",
    name: #{ firstName: "Joe", lastName: "Smithers" },
    address: #{
      street1: "456 Rio",
      city: "Montevideo",
      province: "Montevideo",
      country: Questions.Types.CountryCode.URY,
    },
    phone: "1234567890",
    email: "person@place.com",
  };
}
