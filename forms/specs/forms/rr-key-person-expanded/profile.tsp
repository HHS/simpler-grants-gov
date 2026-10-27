import "simpler-forms";

import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/index.tsp";
import "#questions/research/index.tsp";

using SimplerForms;

namespace Forms.RRKeyPersonExpanded;

// `ProjectRoleDataType` in RR_KeyPersonExpanded_4_0-V4.0.xsd.
/** Select the person's role on the project. */
@UI.label("Project Role")
enum RRExpandedProjectRole {
  pdPi: "PD/PI",
  coPdPi: "Co-PD/PI",
  faculty: "Faculty",
  postDoctoral: "Post Doctoral",
  postDoctoralAssociate: "Post Doctoral Associate",
  postDoctoralScholar: "Post Doctoral Scholar",
  otherProfessional: "Other Professional",
  graduateStudent: "Graduate Student",
  undergraduateStudent: "Undergraduate Student",
  technician: "Technician",
  consultant: "Consultant",
  coInvestigator: "Co-Investigator",
  otherSpecify: "Other (Specify)",
}

/** Enter the highest academic or professional degree or other credentials (e.g., RN). */
@UI.label("Degree Type")
@minLength(1)
@maxLength(75)
scalar DegreeType extends string;

/** Enter the year the highest degree or other credential was obtained. */
@UI.label("Degree Year")
@minLength(1)
@maxLength(25)
scalar DegreeYear extends string;

/** One person's profile. The PD/PI and each senior/key person share it. */
model RRExpandedKeyPersonProfile {
  ...Questions.People.Person;
  organizationName?: Questions.Organizations.OrgName;
  department?: Questions.Organizations.OrgDepartment;
  division?: Questions.Organizations.OrgDivision;
  credential?: Questions.Research.Credential;
  projectRole: RRExpandedProjectRole;

  @UI.enabledWhenAny(
    RRExpandedKeyPersonProfile.projectRole,
    RRExpandedProjectRole.otherProfessional,
    RRExpandedProjectRole.otherSpecify
  )
  otherProjectRoleCategory?: Questions.Research.OtherProjectRoleCategory;

  degreeType?: DegreeType;
  degreeYear?: DegreeYear;
  biographicalSketch?: Questions.Research.BiographicalSketch;
  currentPendingSupport?: Questions.Research.CurrentPendingSupport;
}

// Holds the profile as the XSD's `Profile` element does.
/** A person on the form and their profile. */
model RRExpandedKeyPersonEntry {
  // `Person` makes the email optional; every key-person profile requires it.
  @Validation.requiredPaths("email")
  profile: RRExpandedKeyPersonProfile;
}

/** Sample people, type-checked against the profiles and used by the form's example. */
namespace Examples {
  const principalInvestigator: Forms.RRKeyPersonExpanded.RRExpandedKeyPersonProfile = #{
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
    projectRole: RRExpandedProjectRole.pdPi,
    credential: "mchen",
    degreeType: "PhD",
    degreeYear: "2008",
    biographicalSketch: "3f1c2a9e-5b7d-4c1e-9a2b-1d4e6f8a0b11",
    currentPendingSupport: "7a2e4c6b-8d1f-4a3e-b5c7-2e4f6a8b0c22",
  };

  const engineer: Forms.RRKeyPersonExpanded.RRExpandedKeyPersonProfile = #{
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
    projectRole: RRExpandedProjectRole.otherProfessional,
    otherProjectRoleCategory: "Engineer",
    degreeType: "MS",
    degreeYear: "2015",
  };
}
