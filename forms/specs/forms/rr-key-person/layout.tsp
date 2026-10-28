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
  principalInvestigator: RRKeyPersonProfileLayout<"the PD/PI's ">;

  /** Enter a profile for each senior/key person on the project, up to 7. */
  @UI.label("Senior/Key Person Profiles")
  @UI.field(RRKeyPerson.seniorKeyPersons)
  seniorKeyPersons: RRKeyPersonProfileLayout<"the senior/key person's ">;

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

/**
 * One person's profile, in the groups every key-person form shares. `Whose` names the person
 * in each group's description: "the PD/PI's " or "the senior/key person's ".
 */
model RRKeyPersonProfileLayout<Whose extends valueof string> {
  @doc("Enter ${Whose}name. First and last name are required.")
  name: RRKeyPersonProfile.name;

  @doc("Enter ${Whose}position, organization and role on the project.")
  @UI.label("Role")
  role: {
    title: RRKeyPersonProfile.title;
    organizationName: RRKeyPersonProfile.organizationName;
    department: RRKeyPersonProfile.department;
    division: RRKeyPersonProfile.division;
    projectRole: RRKeyPersonProfile.projectRole;
    otherProjectRoleCategory: RRKeyPersonProfile.otherProjectRoleCategory;
  };

  @doc("Enter ${Whose}complete address.")
  address: RRKeyPersonProfile.address;

  @doc("Enter ${Whose}phone, fax and email. Phone and email are required.")
  @UI.label("Contact Information")
  contact: {
    phone: RRKeyPersonProfile.phone;
    fax: RRKeyPersonProfile.fax;
    email: RRKeyPersonProfile.email;
  };

  @doc("Enter ${Whose}agency credential, if they have one.")
  @UI.label("Credentials")
  credentials: {
    credential: RRKeyPersonProfile.credential;
  };

  @doc("Attach ${Whose}biographical sketch and current & pending support.")
  @UI.label("Attachments")
  attachments: {
    biographicalSketch: RRKeyPersonProfile.biographicalSketch;
    currentPendingSupport: RRKeyPersonProfile.currentPendingSupport;
  };
}
