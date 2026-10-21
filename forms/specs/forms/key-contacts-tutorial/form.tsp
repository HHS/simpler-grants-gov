import "form-library-xml";
import "simpler-forms";

import "#forms/index.tsp";
import "#questions/types/codes.tsp";

using SimplerForms;

namespace Forms.KeyContactsTutorial;

/** KEY CONTACTS, rebuilt for the form library tutorial. */
@Meta.form(#{ id: "key-contacts-tutorial", formName: "KEY CONTACTS (TUTORIAL)" })
@GrantsGov.form(#{
  legacyFormId: 683,
  shortFormName: "Key_Contacts_Tutorial",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "4040-0010",
})
model KeyContactsTutorial {
  /** Enter the legal name of the applicant that will undertake the assistance activity. This field is required. */
  @UI.label("Applicant Organization Name")
  @minLength(1)
  @maxLength(60)
  applicantOrganizationName: string;

  @UI.label("Key Contacts")
  @minItems(1)
  @maxItems(4)
  keyContacts: TutorialKeyContact[];
}

/** One key contact. Every field is declared here rather than taken from the question bank. */
model TutorialKeyContact {
  /** Enter the project role of the contact person (e.g., project manager, fiscal contact). Additional contacts are optional. */
  @UI.label("Contact 1 Project Role")
  @minLength(1)
  @maxLength(45)
  projectRole: string;

  @UI.label("Name")
  name: TutorialContactName;

  /** Enter the position title. */
  @UI.label("Title")
  @minLength(1)
  @maxLength(45)
  title?: string;

  /** Enter the Organizational Affiliation of the person to contact on matters related to this application. */
  @UI.label("Organizational Affiliation")
  @minLength(1)
  @maxLength(60)
  organizationalAffiliation?: string;

  @UI.label("Address")
  address: TutorialContactAddress;

  /** Enter the daytime Telephone Number. This field is required. */
  @UI.label("Telephone Number")
  @minLength(1)
  @maxLength(25)
  phone: string;

  /** Enter the Fax Number. */
  @UI.label("Fax")
  @minLength(1)
  @maxLength(25)
  fax?: string;

  /** Enter a valid Email Address. This field is required. */
  @UI.label("Email")
  @minLength(1)
  @maxLength(60)
  email: string;
}

model TutorialContactName {
  /** Select the Prefix from the provided list or enter a new Prefix not provided on the list. */
  @UI.label("Prefix")
  @minLength(1)
  @maxLength(10)
  prefix?: string;

  /** Enter the contact's given name. */
  @UI.label("Given Name")
  @minLength(1)
  @maxLength(35)
  firstName: string;

  /** Enter the Middle Name. */
  @UI.label("Middle Name")
  @minLength(1)
  @maxLength(25)
  middleName?: string;

  /** Enter the Last Name. This field is required. */
  @UI.label("Last Name")
  @minLength(1)
  @maxLength(60)
  lastName: string;

  /** Select the Suffix from the provided list or enter a new Suffix not provided on the list. */
  @UI.label("Suffix")
  @minLength(1)
  @maxLength(10)
  suffix?: string;
}

model TutorialContactAddress {
  /** Enter the first line of the Street Address. This field is required. */
  @UI.label("Street1")
  @minLength(1)
  @maxLength(55)
  street1: string;

  /** Enter the second line of the Street Address. */
  @UI.label("Street2")
  @minLength(1)
  @maxLength(55)
  street2?: string;

  /** Enter the City. This field is required. */
  @UI.label("City")
  @minLength(1)
  @maxLength(35)
  city: string;

  /** Enter the County. */
  @UI.label("County")
  @minLength(1)
  @maxLength(30)
  county?: string;

  /** Select the state, US possession or military code from the provided list. This field is required if Country is the United States. */
  @UI.label("State")
  state?: Questions.Types.StateCode;

  /** Enter the Province. */
  @UI.label("Province")
  @minLength(1)
  @maxLength(30)
  province?: string;

  /** Select the Country from the provided list. This field is required. */
  @UI.label("Country")
  country: Questions.Types.CountryCode;

  /** Enter the Postal Code (e.g., ZIP code). This field is required if Country is the United States. */
  @UI.label("Zip / Postal Code")
  @minLength(1)
  @maxLength(30)
  zipCode?: string;
}
