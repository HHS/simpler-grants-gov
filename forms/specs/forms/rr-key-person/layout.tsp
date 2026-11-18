import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.RRKeyPerson;

// =============================================================================
// FORM LAYOUT
// =============================================================================

// The paper form's sections: the PD/PI, the other senior/key persons, then the attachments
// for anyone the form has no room for.
@UI.layout(RRKeyPerson)
model RRKeyPersonLayout {
  /** Enter the profile of the Project Director/Principal Investigator (PD/PI). */
  @UI.label("PD/PI Profile")
  @UI.field(RRKeyPerson.principalInvestigator)
  principalInvestigator: RRKeyPersonProfileLayout;

  /** Enter a profile for each senior/key person on the project, up to 7. */
  @UI.label("Senior/Key Person Profiles")
  @UI.field(RRKeyPerson.seniorKeyPersons)
  seniorKeyPersons: RRKeyPersonProfileLayout;

  /** If the project has more than 7 senior/key persons, attach the rest of their profiles and supporting documents, each kind in a single file. */
  @UI.label("Additional Profiles and Attachments")
  additional: {
    additionalProfiles: RRKeyPerson.additionalProfiles;
    additionalBiographicalSketches: RRKeyPerson.additionalBiographicalSketches;
    additionalCurrentPendingSupport: RRKeyPerson.additionalCurrentPendingSupport;
  };
}

// =============================================================================
// PROFILE LAYOUT
// =============================================================================

/** One person's profile, for the PD/PI and each senior/key person. */
model RRKeyPersonProfileLayout {
  @UI.flatten name: RRKeyPersonProfile.name;
  title: RRKeyPersonProfile.title;
  organizationName: RRKeyPersonProfile.organizationName;
  department: RRKeyPersonProfile.department;
  division: RRKeyPersonProfile.division;
  projectRole: RRKeyPersonProfile.projectRole;
  otherProjectRoleCategory: RRKeyPersonProfile.otherProjectRoleCategory;
  @UI.flatten address: RRKeyPersonProfile.address;
  phone: RRKeyPersonProfile.phone;
  fax: RRKeyPersonProfile.fax;
  email: RRKeyPersonProfile.email;
  credential: RRKeyPersonProfile.credential;
  biographicalSketch: RRKeyPersonProfile.biographicalSketch;
  currentPendingSupport: RRKeyPersonProfile.currentPendingSupport;
}
