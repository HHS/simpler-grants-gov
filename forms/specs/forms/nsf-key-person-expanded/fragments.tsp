import "simpler-forms";

import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/index.tsp";
import "#questions/research/index.tsp";

using SimplerForms;

namespace Forms.NSFKeyPersonExpanded;

// =============================================================================
// PROFILES
// =============================================================================

/**
 * What the PD/PI's and each senior/key person's profiles share. They are different XSD
 * types that differ in one field: the organization's name, or its UEI.
 */
model NSFProfileBase {
  // `Person` makes the email optional; every key-person profile requires it. Required here
  // rather than with `@Validation.requiredPaths` on the entry, which emits it twice
  // (agilesix/simpler-forms#22).
  ...OmitProperties<Questions.People.Person, "email">;

  /** Enter the email address. */
  @UI.label("Email")
  email: Questions.People.PersonEmail;

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

// =============================================================================
// ANSWER TYPES
// =============================================================================

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
@pattern("^[0-9A-Z]{9}$")
scalar NSFID extends string;
