import "simpler-forms";

import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/index.tsp";
import "#questions/research/index.tsp";

using SimplerForms;

namespace Forms.RRKeyPersonExpanded;

// =============================================================================
// PROFILE
// =============================================================================

/** One person's profile. The PD/PI and each senior/key person share it. */
model RRExpandedKeyPersonProfile {
  // `Person` makes the email optional; every key-person profile requires it. Required here
  // rather than with `@Validation.requiredPaths` on the entry, which emits it twice
  // (agilesix/simpler-forms#22).
  ...OmitProperties<Questions.People.Person, "email">;

  /** Enter the email address. */
  @UI.label("Email")
  email: Questions.People.PersonEmail;

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

// =============================================================================
// ANSWER TYPES
// =============================================================================

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
