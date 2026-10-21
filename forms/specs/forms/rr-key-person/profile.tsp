import "simpler-forms";

import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/index.tsp";
import "#questions/research/index.tsp";

using SimplerForms;

namespace Forms.RRKeyPerson;

// `ProjectRoleDataType` in RR_KeyPerson_3_0-V3.0.xsd.
/** Select the person's role on the project. */
@UI.label("Project Role")
enum RRProjectRole {
  pdPi: "PD/PI",
  coPdPi: "Co-PD/PI",
  faculty: "Faculty",
  postDoctoral: "Post Doctoral",
  postDoctoralAssociate: "Post Doctoral Associate",
  otherProfessional: "Other Professional",
  graduateStudent: "Graduate Student",
  undergraduateStudent: "Undergraduate Student",
  technician: "Technician",
  consultant: "Consultant",
  otherSpecify: "Other (Specify)",
}

/** One person's profile. The PD/PI and each senior/key person share it. */
model RRKeyPersonProfile {
  ...Questions.People.Person;
  organizationName?: Questions.Organizations.OrgName;
  department?: Questions.Organizations.OrgDepartment;
  division?: Questions.Organizations.OrgDivision;
  credential?: Questions.Research.Credential;
  projectRole: RRProjectRole;

  @UI.enabledWhenAny(
    RRKeyPersonProfile.projectRole,
    RRProjectRole.otherProfessional,
    RRProjectRole.otherSpecify
  )
  otherProjectRoleCategory?: Questions.Research.OtherProjectRoleCategory;

  biographicalSketch: Questions.Research.BiographicalSketch;
  currentPendingSupport?: Questions.Research.CurrentPendingSupport;
}

/** A person on the form, holding their profile as the XSD's `Profile` element does. */
model RRKeyPersonEntry {
  // `Person` makes the email optional; every key-person profile requires it.
  @Validation.requiredPaths("email")
  profile: RRKeyPersonProfile;
}

/** Sample people, type-checked against the profiles and used by the form's example. */
namespace Examples {
  const principalInvestigator: Forms.RRKeyPerson.RRKeyPersonProfile = #{
    name: #{ prefix: "Dr.", firstName: "Maria", lastName: "Chen" },
    title: "Professor of Biology",
    organizationName: "University of Wisconsin-Madison",
    department: "Department of Biology",
    address: #{
      street1: "1200 University Avenue",
      city: "Madison",
      state: Questions.Types.StateCode.WI,
      zipCode: "53706-1380",
      country: Questions.Types.CountryCode.USA,
    },
    phone: "6085550100",
    email: "maria.chen@example.edu",
    projectRole: RRProjectRole.pdPi,
    credential: "mchen",
    biographicalSketch: "3f1c2a9e-5b7d-4c1e-9a2b-1d4e6f8a0b11",
    currentPendingSupport: "7a2e4c6b-8d1f-4a3e-b5c7-2e4f6a8b0c22",
  };

  const engineer: Forms.RRKeyPerson.RRKeyPersonProfile = #{
    name: #{ prefix: "Mr.", firstName: "Tom", lastName: "Okafor" },
    title: "Research Engineer",
    organizationName: "University of Cambridge",
    department: "Department of Engineering",
    address: #{
      street1: "25 King's Parade",
      city: "Cambridge",
      province: "Cambridgeshire",
      zipCode: "CB2 1ST",
      country: Questions.Types.CountryCode.GBR,
    },
    phone: "6085550100",
    email: "tom.okafor@example.ac.uk",
    projectRole: RRProjectRole.otherProfessional,
    otherProjectRoleCategory: "Engineer",
    biographicalSketch: "b4d6f8a0-1c3e-4f5a-8b7c-3e5f7a9b1d33",
  };
}
