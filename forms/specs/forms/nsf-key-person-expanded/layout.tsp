import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.NSFKeyPersonExpanded;

// =============================================================================
// FORM LAYOUT
// =============================================================================

// The paper form's sections: the PD/PI, the other senior/key persons, then the attachments
// for anyone the form has no room for.
@UI.layout(NSFKeyPersonExpanded)
model NSFKeyPersonExpandedLayout {
  /** Enter the profile of the Project Director/Principal Investigator (PD/PI). */
  @UI.label("PD/PI Profile")
  @UI.field(NSFKeyPersonExpanded.principalInvestigator)
  principalInvestigator: NSFPrincipalInvestigatorProfileLayout;

  /** Enter a profile for each senior/key person on the project, up to 99. */
  @UI.label("Senior/Key Person Profiles")
  @UI.field(NSFKeyPersonExpanded.seniorKeyPersons)
  seniorKeyPersons: NSFSeniorKeyPersonProfileLayout;

  /** If the project has more than 99 senior/key persons, attach the rest of their profiles and supporting documents, each kind in a single file. */
  @UI.label("Additional Profiles and Attachments")
  additional: {
    additionalProfiles: NSFKeyPersonExpanded.additionalProfiles;
    additionalBiographicalSketches: NSFKeyPersonExpanded.additionalBiographicalSketches;
    additionalCurrentPendingSupport: NSFKeyPersonExpanded.additionalCurrentPendingSupport;
    additionalCollaborators: NSFKeyPersonExpanded.additionalCollaborators;
    additionalSynergisticActivities: NSFKeyPersonExpanded.additionalSynergisticActivities;
  };
}

// =============================================================================
// PROFILE LAYOUTS
// =============================================================================

/** The PD/PI's profile. */
model NSFPrincipalInvestigatorProfileLayout {
  @UI.flatten name: NSFPrincipalInvestigatorProfile.name;
  title: NSFPrincipalInvestigatorProfile.title;
  organizationName: NSFPrincipalInvestigatorProfile.organizationName;
  department: NSFPrincipalInvestigatorProfile.department;
  division: NSFPrincipalInvestigatorProfile.division;
  projectRole: NSFPrincipalInvestigatorProfile.projectRole;
  @UI.flatten address: NSFPrincipalInvestigatorProfile.address;
  phone: NSFPrincipalInvestigatorProfile.phone;
  fax: NSFPrincipalInvestigatorProfile.fax;
  email: NSFPrincipalInvestigatorProfile.email;
  nsfId: NSFPrincipalInvestigatorProfile.nsfId;
  biographicalSketch: NSFPrincipalInvestigatorProfile.biographicalSketch;
  currentPendingSupport: NSFPrincipalInvestigatorProfile.currentPendingSupport;
  collaborators: NSFPrincipalInvestigatorProfile.collaborators;
  synergisticActivities: NSFPrincipalInvestigatorProfile.synergisticActivities;
}

/** A senior/key person's profile. */
model NSFSeniorKeyPersonProfileLayout {
  @UI.flatten name: NSFSeniorKeyPersonProfile.name;
  title: NSFSeniorKeyPersonProfile.title;
  organizationUei: NSFSeniorKeyPersonProfile.organizationUei;
  department: NSFSeniorKeyPersonProfile.department;
  division: NSFSeniorKeyPersonProfile.division;
  projectRole: NSFSeniorKeyPersonProfile.projectRole;
  @UI.flatten address: NSFSeniorKeyPersonProfile.address;
  phone: NSFSeniorKeyPersonProfile.phone;
  fax: NSFSeniorKeyPersonProfile.fax;
  email: NSFSeniorKeyPersonProfile.email;
  nsfId: NSFSeniorKeyPersonProfile.nsfId;
  biographicalSketch: NSFSeniorKeyPersonProfile.biographicalSketch;
  currentPendingSupport: NSFSeniorKeyPersonProfile.currentPendingSupport;
  collaborators: NSFSeniorKeyPersonProfile.collaborators;
  synergisticActivities: NSFSeniorKeyPersonProfile.synergisticActivities;
}
