import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "#questions/opportunity/index.tsp";
import "#questions/project/index.tsp";
import "#questions/certification/index.tsp";
import "#questions/person/index.tsp";

using SimplerForms;

namespace Forms.SF424Individual;

// Opportunity-owned metadata is separate from the application receipt date.
model Opportunity {
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.agencyName)
  agencyName: Questions.Opportunities.AgencyName;

  assistanceListing?: AssistanceListing;

  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.opportunityNumber)
  number: Questions.Opportunities.OpportunityNumber;

  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.opportunityTitle)
  title: Questions.Opportunities.OpportunityTitle;
}

model AssistanceListing {
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.assistanceListingNumber)
  number?: Questions.Opportunities.AssistanceListingNumber;

  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.assistanceListingTitle)
  title?: Questions.Opportunities.AssistanceListingTitle;
}

model Applicant {
  name: Questions.People.PersonName;
  address: Questions.People.PersonAddress;
  phone: Questions.People.PersonPhoneNumber;

  /** Enter the evening telephone number. */
  @UI.label("Phone Number (Evening)")
  eveningPhone?: Questions.People.PersonPhoneNumber;

  fax?: Questions.People.PersonFaxNumber;
  email: Questions.People.PersonEmail;

  @UI.label("Citizenship Status")
  citizenship: Citizenship;

  @UI.label("Congressional District of Applicant")
  congressionalDistrict: Questions.People.PersonCongressionalDistrict;
}

// The DAT explicitly requires country/date for No, while its labels refer to foreign
// nationals. Preserve that source conflict in the plan/comparison; do not invent a third status.
model Citizenship {
  @UI.label("U.S. Citizenship")
  @UI.widget(Rendering.Widget.Radio)
  isUsCitizen: boolean;

  /** Enter the Alien Registration Number. */
  @UI.label("If permanent resident of U.S., enter the Alien Registration #")
  @UI.enabledWhen(Citizenship.isUsCitizen, false)
  @minLength(1)
  @maxLength(14)
  alienRegistrationNumber?: string;

  /** Select the country. This field is required if the applicant is not a U.S. citizen. */
  @UI.label("If foreign national, enter country of citizenship")
  @UI.enabledWhen(Citizenship.isUsCitizen, false)
  @Validation.requiredWhen(Citizenship.isUsCitizen, false)
  countryOfCitizenship?: Questions.Types.CountryCode;

  /** Enter the start date of the most recent residency in the U.S. This field is required if the applicant is not a U.S. citizen. */
  @UI.label("If foreign national, enter start date of most recent residency in U.S.")
  @UI.enabledWhen(Citizenship.isUsCitizen, false)
  @Validation.requiredWhen(Citizenship.isUsCitizen, false)
  residencyStartDate?: plainDate;
}

model Project {
  title: Questions.Projects.ProjectTitle;
  description: Questions.Projects.ProjectDescription;
  startDate: Questions.Projects.ProjectStartDate;

  /** Enter the end date for the proposed project. The end date cannot be earlier than the start date. */
  @Validation.notBefore(Project.startDate)
  endDate: Questions.Projects.ProjectEndDate;
}

model Certification {
  /** The list of certifications and assurances, or an internet site where you may obtain this list, is contained in the announcement or agency specific instructions. */
  @UI.label("I Agree")
  @UI.widget(Rendering.Widget.Checkbox)
  agree: true;

  /** Completed by Grants.gov upon submission. */
  @UI.label("Signature")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.signature)
  signature?: Questions.Certifications.Signature;

  /** Completed by Grants.gov upon submission. */
  @UI.label("Date Signed")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.currentDate)
  dateSigned?: Questions.Certifications.DateSigned;
}
