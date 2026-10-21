import "simpler-forms";

import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/index.tsp";
import "#questions/research/index.tsp";

using SimplerForms;

namespace Forms.NSFKeyPersonExpanded;

// `ProjectRoleDataType` in NSF_KeyPersonExpanded_3_3-V3.3.xsd.
/** Select the person's role on the project. */
@UI.label("Project Role")
enum NSFProjectRole {
  pdPi: "PD/PI",
  coPdPi: "Co-PD/PI",
  otherSeniorPersonnel: "Other Senior Personnel",
}

/** Enter the person's NSF ID, if they have one. */
@UI.label("NSF ID")
@pattern("[0-9A-Z]{9}")
scalar NSFID extends string;

/**
 * What the PD/PI's and each senior/key person's profiles share. They are different XSD
 * types that differ in one field: the organization's name, or its UEI.
 */
model NSFProfileBase {
  ...Questions.People.Person;
  department?: Questions.Organizations.OrgDepartment;
  division?: Questions.Organizations.OrgDivision;
  projectRole: NSFProjectRole;
  nsfId?: NSFID;
  biographicalSketch: Questions.Research.BiographicalSketch;
  currentPendingSupport: Questions.Research.CurrentPendingSupport;
  collaborators: Questions.Research.Collaborators;
  synergisticActivities: Questions.Research.SynergisticActivities;
}

/** The PD/PI's profile, which names the organization. */
model NSFPrincipalInvestigatorProfile {
  ...NSFProfileBase;
  organizationName?: Questions.Organizations.OrgName;
}

/** A senior/key person's profile, which gives the organization's UEI instead of its name. */
model NSFSeniorKeyPersonProfile {
  ...NSFProfileBase;
  organizationUei?: Questions.Organizations.OrgUei;
}

/** A person on the form, holding their profile as the XSD's `Profile` element does. */
model NSFPrincipalInvestigator {
  // `Person` makes the email optional; every key-person profile requires it.
  @Validation.requiredPaths("email")
  profile: NSFPrincipalInvestigatorProfile;
}

/** A person on the form, holding their profile as the XSD's `Profile` element does. */
model NSFSeniorKeyPerson {
  // `Person` makes the email optional; every key-person profile requires it.
  @Validation.requiredPaths("email")
  profile: NSFSeniorKeyPersonProfile;
}

/** Sample people, type-checked against the profiles and used by the form's example. */
namespace Examples {
  const principalInvestigator: Forms.NSFKeyPersonExpanded.NSFPrincipalInvestigatorProfile = #{
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
    projectRole: NSFProjectRole.pdPi,
    nsfId: "000123456",
    biographicalSketch: "3f1c2a9e-5b7d-4c1e-9a2b-1d4e6f8a0b11",
    currentPendingSupport: "7a2e4c6b-8d1f-4a3e-b5c7-2e4f6a8b0c22",
    collaborators: "b4d6f8a0-1c3e-4f5a-8b7c-3e5f7a9b1d33",
    synergisticActivities: "c5e7a9b1-2d4f-4a6b-9c8d-4f6a8b0c2e44",
  };

  const engineer: Forms.NSFKeyPersonExpanded.NSFSeniorKeyPersonProfile = #{
    name: #{ prefix: "Mr.", firstName: "Tom", lastName: "Okafor" },
    title: "Research Engineer",
    organizationUei: "ABCDEFGH1234",
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
    projectRole: NSFProjectRole.otherSeniorPersonnel,
    biographicalSketch: "3f1c2a9e-5b7d-4c1e-9a2b-1d4e6f8a0b11",
    currentPendingSupport: "7a2e4c6b-8d1f-4a3e-b5c7-2e4f6a8b0c22",
    collaborators: "b4d6f8a0-1c3e-4f5a-8b7c-3e5f7a9b1d33",
    synergisticActivities: "c5e7a9b1-2d4f-4a6b-9c8d-4f6a8b0c2e44",
  };
}
