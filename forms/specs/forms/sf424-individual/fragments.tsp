import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#questions/application/index.tsp";
import "#questions/opportunity/index.tsp";
import "#questions/person/index.tsp";
import "#questions/project/index.tsp";
import "#questions/types/address.tsp";
import "#questions/types/codes.tsp";
import "#questions/types/congressional-district.tsp";
import "#questions/types/yes-no.tsp";

using SimplerForms;

namespace Forms.SF424Individual;

// =============================================================================
// OPPORTUNITY
// =============================================================================

// Pre-populate every opportunity value and show it read-only.
model SF424IndividualOpportunity {
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.agencyName)
  agencyName: Questions.Opportunities.AgencyName;

  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.opportunityNumber)
  number: Questions.Opportunities.OpportunityNumber;

  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.opportunityTitle)
  title: Questions.Opportunities.OpportunityTitle;

  assistanceListing?: Questions.Opportunities.AssistanceListing;
}

// =============================================================================
// APPLICATION
// =============================================================================

model SF424IndividualApplication {
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.currentDate)
  dateReceived?: Questions.Applications.DateReceived;
}

// =============================================================================
// APPLICANT
// =============================================================================

// The applicant is the individual: ask what only a person has, plus the district.
model SF424IndividualApplicant {
  person: SF424IndividualPerson;

  /** Enter the Congressional District as a two-character state abbreviation, a hyphen and a three-digit district number (for example, CA-005). If outside the US, enter 00-000. */
  congressionalDistrict: Questions.Types.CongressionalDistrictCode;
}

model SF424IndividualPerson {
  citizenship: SF424IndividualCitizenship;
}

// The DAT requires country and date for No, while its labels refer to foreign nationals.
// Follow the explicit No rule and record the conflict in the plan; don't invent a third status.
model SF424IndividualCitizenship {
  isUsCitizen: Questions.Types.YesNo;

  /** Select the country. This field is required if the applicant is not a U.S. citizen. */
  @UI.enabledWhen(SF424IndividualCitizenship.isUsCitizen, false)
  @Validation.requiredWhen(SF424IndividualCitizenship.isUsCitizen, false)
  country?: Questions.Types.CountryCode;

  /** Enter the Alien Registration Number. */
  @UI.label("Alien Registration Number")
  @UI.enabledWhen(SF424IndividualCitizenship.isUsCitizen, false)
  @minLength(1)
  @maxLength(14)
  alienRegistrationNumber?: string;

  /** Enter the start date of the most recent residency in the U.S. This field is required if the applicant is not a U.S. citizen. */
  @UI.label("Residency Start Date")
  @UI.enabledWhen(SF424IndividualCitizenship.isUsCitizen, false)
  @Validation.requiredWhen(SF424IndividualCitizenship.isUsCitizen, false)
  residencyStartDate?: plainDate;
}

// =============================================================================
// PROJECT
// =============================================================================

model SF424IndividualProject {
  title: Questions.Projects.ProjectTitle;
  description: Questions.Projects.ProjectDescription;
  timeline: SF424IndividualProjectTimeline;
}

model SF424IndividualProjectTimeline {
  startDate: Questions.Projects.ProjectStartDate;

  /** Enter the end date for the proposed project. The end date cannot be earlier than the start date. */
  @Validation.notBefore(SF424IndividualProjectTimeline.startDate)
  endDate: Questions.Projects.ProjectEndDate;
}

// =============================================================================
// CONTACTS
// =============================================================================

model SF424IndividualContacts {
  pointOfContact: SF424IndividualPointOfContact;
}

// The applicant's own contact details. The XSD names these elements
// `AuthorizedRepresentative*`, but the form has no organization and no AOR.
model SF424IndividualPointOfContact {
  name: Questions.People.PersonName;
  address: Questions.Types.AddressZipPlusFour;
  phone: Questions.People.PersonPhoneNumber;

  /** Enter the evening telephone number. */
  eveningPhone?: Questions.People.PersonPhoneNumber;

  fax?: Questions.People.PersonFaxNumber;
  email: Questions.People.PersonEmail;
}
