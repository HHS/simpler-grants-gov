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

/** The PD/PI's profile, in the groups every key-person form shares. */
model NSFPrincipalInvestigatorProfileLayout {
  /** Enter the PD/PI's name. First and last name are required. */
  name: NSFPrincipalInvestigatorProfile.name;

  /** Enter the PD/PI's position, organization and role on the project. */
  @UI.label("Role")
  role: {
    title: NSFPrincipalInvestigatorProfile.title;
    organizationName: NSFPrincipalInvestigatorProfile.organizationName;
    department: NSFPrincipalInvestigatorProfile.department;
    division: NSFPrincipalInvestigatorProfile.division;
    projectRole: NSFPrincipalInvestigatorProfile.projectRole;
  };

  /** Enter the PD/PI's complete address. */
  address: NSFPrincipalInvestigatorProfile.address;

  /** Enter the PD/PI's phone, fax and email. Phone and email are required. */
  @UI.label("Contact Information")
  contact: {
    phone: NSFPrincipalInvestigatorProfile.phone;
    fax: NSFPrincipalInvestigatorProfile.fax;
    email: NSFPrincipalInvestigatorProfile.email;
  };

  /** Enter the PD/PI's NSF ID, if they have one. */
  @UI.label("Credentials")
  credentials: {
    nsfId: NSFPrincipalInvestigatorProfile.nsfId;
  };

  /** Attach the PD/PI's biographical sketch, current & pending (other) support, collaborators and other affiliations, and synergistic activities. */
  @UI.label("Attachments")
  attachments: {
    biographicalSketch: NSFPrincipalInvestigatorProfile.biographicalSketch;
    currentPendingSupport: NSFPrincipalInvestigatorProfile.currentPendingSupport;
    collaborators: NSFPrincipalInvestigatorProfile.collaborators;
    synergisticActivities: NSFPrincipalInvestigatorProfile.synergisticActivities;
  };
}

/** A senior/key person's profile, in the groups every key-person form shares. */
model NSFSeniorKeyPersonProfileLayout {
  /** Enter the senior/key person's name. First and last name are required. */
  name: NSFSeniorKeyPersonProfile.name;

  /** Enter the senior/key person's position, organization and role on the project. */
  @UI.label("Role")
  role: {
    title: NSFSeniorKeyPersonProfile.title;
    organizationUei: NSFSeniorKeyPersonProfile.organizationUei;
    department: NSFSeniorKeyPersonProfile.department;
    division: NSFSeniorKeyPersonProfile.division;
    projectRole: NSFSeniorKeyPersonProfile.projectRole;
  };

  /** Enter the senior/key person's complete address. */
  address: NSFSeniorKeyPersonProfile.address;

  /** Enter the senior/key person's phone, fax and email. Phone and email are required. */
  @UI.label("Contact Information")
  contact: {
    phone: NSFSeniorKeyPersonProfile.phone;
    fax: NSFSeniorKeyPersonProfile.fax;
    email: NSFSeniorKeyPersonProfile.email;
  };

  /** Enter the senior/key person's NSF ID, if they have one. */
  @UI.label("Credentials")
  credentials: {
    nsfId: NSFSeniorKeyPersonProfile.nsfId;
  };

  /** Attach the senior/key person's biographical sketch, current & pending (other) support, collaborators and other affiliations, and synergistic activities. */
  @UI.label("Attachments")
  attachments: {
    biographicalSketch: NSFSeniorKeyPersonProfile.biographicalSketch;
    currentPendingSupport: NSFSeniorKeyPersonProfile.currentPendingSupport;
    collaborators: NSFSeniorKeyPersonProfile.collaborators;
    synergisticActivities: NSFSeniorKeyPersonProfile.synergisticActivities;
  };
}
