import "simpler-forms";

import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/index.tsp";
import "#questions/research/index.tsp";

using SimplerForms;

namespace Forms.RRKeyPerson;

// =============================================================================
// PROFILE
// =============================================================================

/** One person's profile. The PD/PI and each senior/key person share it. */
model RRKeyPersonProfile {
  /** Enter the person's name. First and last name are required. */
  @UI.label("Name")
  name: Questions.People.PersonName;

  /** Enter the position title. */
  @UI.label("Title")
  title?: Questions.People.PersonTitle;

  /** Enter the person's complete address. */
  @UI.label("Address")
  address: Questions.People.PersonAddress;

  /** Enter the phone number. */
  @UI.label("Phone Number")
  phone: Questions.People.PersonPhoneNumber;

  /** Enter the fax number. */
  @UI.label("Fax Number")
  fax?: Questions.People.PersonFaxNumber;

  /** Enter the email address. */
  @UI.label("Email")
  email: Questions.People.PersonEmail;

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

// =============================================================================
// ANSWER TYPES
// =============================================================================

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
