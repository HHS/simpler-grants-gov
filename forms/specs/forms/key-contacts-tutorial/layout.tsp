import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.KeyContactsTutorial;

// Every top-level entry of a layout is a section, so the applicant's name gets one of its own.
@UI.layout(KeyContactsTutorial)
model KeyContactsTutorialLayout {
  @UI.label("Applicant Information")
  applicant: {
    applicantOrganizationName: KeyContactsTutorial.applicantOrganizationName;
  };

  /** You may enter up to four (4) key contacts. At least one (1) contact person is required. */
  @UI.label("Key Contacts")
  @UI.field(KeyContactsTutorial.keyContacts)
  keyContacts: {
    // Person's fields come between the project role and the affiliation; the DAT puts the
    // affiliation straight after the title. Entries listed here come first, in this order.
    projectRole: TutorialKeyContact.projectRole;
    name: TutorialKeyContact.name;
    title: TutorialKeyContact.title;
    organizationalAffiliation: TutorialKeyContact.organizationalAffiliation;
  };
}
