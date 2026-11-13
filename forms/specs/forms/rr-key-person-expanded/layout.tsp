import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.RRKeyPersonExpanded;

// =============================================================================
// FORM LAYOUT
// =============================================================================

// The paper form's sections: the PD/PI, the other senior/key persons, then the attachments
// for anyone the form has no room for.
@UI.layout(RRKeyPersonExpanded)
model RRKeyPersonExpandedLayout {
  /** Enter the profile of the Project Director/Principal Investigator (PD/PI). */
  @UI.label("PD/PI Profile")
  @UI.field(RRKeyPersonExpanded.principalInvestigator)
  principalInvestigator: RRExpandedKeyPersonProfileLayout;

  /** Enter a profile for each senior/key person on the project, up to 99. */
  @UI.label("Senior/Key Person Profiles")
  @UI.field(RRKeyPersonExpanded.seniorKeyPersons)
  seniorKeyPersons: RRExpandedKeyPersonProfileLayout;

  /** If the project has more than 99 senior/key persons, attach the rest of their profiles and supporting documents, each kind in a single file. */
  @UI.label("Additional Profiles and Attachments")
  additional: {
    additionalProfiles: RRKeyPersonExpanded.additionalProfiles;
    additionalBiographicalSketches: RRKeyPersonExpanded.additionalBiographicalSketches;
    additionalCurrentPendingSupport: RRKeyPersonExpanded.additionalCurrentPendingSupport;
  };
}

// =============================================================================
// PROFILE LAYOUT
// =============================================================================

/** One person's profile, for the PD/PI and each senior/key person. */
model RRExpandedKeyPersonProfileLayout {
  @UI.flatten name: RRExpandedKeyPersonProfile.name;
  title: RRExpandedKeyPersonProfile.title;
  organizationName: RRExpandedKeyPersonProfile.organizationName;
  department: RRExpandedKeyPersonProfile.department;
  division: RRExpandedKeyPersonProfile.division;
  projectRole: RRExpandedKeyPersonProfile.projectRole;
  otherProjectRoleCategory: RRExpandedKeyPersonProfile.otherProjectRoleCategory;
  @UI.flatten address: RRExpandedKeyPersonProfile.address;
  phone: RRExpandedKeyPersonProfile.phone;
  fax: RRExpandedKeyPersonProfile.fax;
  email: RRExpandedKeyPersonProfile.email;
  credential: RRExpandedKeyPersonProfile.credential;
  degreeType: RRExpandedKeyPersonProfile.degreeType;
  degreeYear: RRExpandedKeyPersonProfile.degreeYear;
  biographicalSketch: RRExpandedKeyPersonProfile.biographicalSketch;
  currentPendingSupport: RRExpandedKeyPersonProfile.currentPendingSupport;
}
