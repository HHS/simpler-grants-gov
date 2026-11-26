import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#questions/application/index.tsp";
import "#questions/certification/index.tsp";
import "#questions/opportunity/index.tsp";
import "#questions/organization/applicant-type.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/index.tsp";
import "#questions/project/index.tsp";
import "#questions/types/address.tsp";
import "#questions/types/congressional-district.tsp";

using SimplerForms;

namespace Forms.SF424Short;

// =============================================================================
// OPPORTUNITY
// =============================================================================

// Grants.gov fills every opportunity field from the application cover sheet.
model ShortOpportunity {
  /** Pre-populated from the Application cover sheet. */
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.agencyName)
  agencyName: Questions.Opportunities.AgencyName;

  assistanceListing?: Questions.Opportunities.AssistanceListing;

  /** Pre-populated from the Application cover sheet. */
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.opportunityNumber)
  number: Questions.Opportunities.OpportunityNumber;

  /** Pre-populated from the Application cover sheet. */
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.opportunityTitle)
  title: Questions.Opportunities.OpportunityTitle;
}

// =============================================================================
// APPLICATION
// =============================================================================

model ShortApplication {
  /** Completed by Grants.gov upon submission. */
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.currentDate)
  dateReceived?: Questions.Applications.DateReceived;
}

// =============================================================================
// APPLICANT
// =============================================================================

model ShortApplicant {
  organization: Forms.SF424Short.ShortOrganization;
  type: Forms.SF424Short.ShortApplicantType;

  /** Congressional District of Applicant is required: Enter the Congressional District in the format: 2 character State Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th District, CA-012 for California's 12th District, NC-103 for North Carolina's 103rd District. If outside the U.S., enter 00-000. */
  congressionalDistrict: Questions.Types.CongressionalDistrictCode;
}

// Short asks for a web address, and no department or division.
model ShortOrganization {
  name: Questions.Organizations.OrgName;

  /** UEI of the applicant organization. This field is pre-populated from the Application cover sheet. */
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.uei)
  uei: Questions.Organizations.OrgUei;

  /** Enter either TIN or EIN as assigned by the Internal Revenue Service.  If your organization is not in the US, enter 44-4444444. */
  ein: Questions.Organizations.OrgEin;

  address: Questions.Types.AddressZipPlusFour;

  /** Enter the applicant's web address, if applicable. */
  @UI.label("Web Address")
  @minLength(1)
  @maxLength(250)
  webAddress?: string;
}

// One to three applicant types, which the XSD writes as `ApplicantTypeCode1`–`3`.
model ShortApplicantType {
  /** Select a minimum of one applicant type or select up to three applicant types in accordance with agency instructions. If “Other” is selected, then specify Other Type of Applicant in text box. */
  @UI.widget(Rendering.Widget.MultiSelect)
  @minItems(1)
  @maxItems(3)
  @JsonSchema.uniqueItems
  codes: Questions.Organizations.ApplicantType[];

  /** Enter the applicant type here if you selected "Other (specify)" for Type of applicant. */
  @UI.label("Type of Applicant Other Explanation")
  @Validation.requiredWhen(
    ShortApplicantType.codes,
    Questions.Organizations.ApplicantType.X
  )
  @minLength(0)
  @maxLength(30)
  otherSpecify?: string;
}

// =============================================================================
// PROJECT
// =============================================================================

model ShortProject {
  /** Enter a brief, descriptive title of the project. */
  title: Questions.Projects.ProjectTitle;

  /** Enter a brief description of the project. */
  description: Questions.Projects.ProjectDescription;

  timeline: Forms.SF424Short.ShortProjectTimeline;
}

model ShortProjectTimeline {
  /** Enter the date in the format MM/DD/YYYY. */
  startDate: Questions.Projects.ProjectStartDate;

  /** Enter the date in the format MM/DD/YYYY. */
  endDate: Questions.Projects.ProjectEndDate;
}

// =============================================================================
// CONTACTS
// =============================================================================

model ShortContacts {
  authorizedRepresentative: Forms.SF424Short.ShortRepresentative;
  projectDirector: Forms.SF424Short.ShortContact;
  pointOfContact: Forms.SF424Short.ShortPointOfContact;
}

// The XSD writes the representative's fields at its root, and the signature under the
// certification.
model ShortRepresentative {
  name: Questions.People.PersonName;
  title: Questions.People.PersonTitle;
  phone: Questions.People.PersonPhoneNumber;
  fax?: Questions.People.PersonFaxNumber;
  email: Questions.People.PersonEmail;
}

// `globLib:ContactPersonDataTypeV3`, with the title and email the form requires.
model ShortContact {
  /** Enter the person's name. First and last name are required. */
  name: Questions.People.PersonName;

  /** Enter the position title. */
  title: Questions.People.PersonTitle;

  /** Enter the person's complete address. */
  address: Questions.Types.AddressZipPlusFour;

  /** Enter the phone number. */
  phone: Questions.People.PersonPhoneNumber;

  /** Enter the fax number. */
  fax?: Questions.People.PersonFaxNumber;

  /** Enter the email address. */
  email: Questions.People.PersonEmail;
}

// Spread the director's fields, so the XSD's contact mapping fills both roles.
model ShortPointOfContact {
  @UI.label("Same as Project Director (if checked, fill in information same as Project Director above)")
  @UI.widget(Rendering.Widget.Checkbox)
  sameAsProjectDirector?: boolean;

  ...Forms.SF424Short.ShortContact;
}
