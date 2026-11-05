import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";
import "#questions/opportunity/index.tsp";
import "#questions/project/index.tsp";
import "#questions/certification/index.tsp";
import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/organization/applicant-type.tsp";
import "#questions/person/index.tsp";
import "#questions/types/address.tsp";

using SimplerForms;
namespace Forms.SF424Short;

/** Application for Federal Domestic Assistance - Short Organizational. */
@Meta.form(#{
  id: "sf424-short",
  formName: "Application for Federal Domestic Assistance-Short Organizational (SF-424)",
})
@GrantsGov.form(#{
  legacyFormId: 711,
  shortFormName: "SF424_Short",
  formVersion: "3.0",
  agencyCode: "SGG",
  ombNumber: "4040-0003",
  expirationDate: "2028-07-31",
})
model SF424Short {
  opportunity: ShortOpportunity;

  @doc("Completed by Grants.gov upon submission.")
  @UI.label("Date Received")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.currentDate)
  dateReceived?: plainDate;

  applicant: ShortApplicant;
  project: ShortProject;

  @Validation.requiredPaths("title", "email")
  @UI.label("Project Director")
  projectDirector: Questions.People.Person;

  @UI.label("Same as Project Director (if checked, fill in information same as Project Director above)")
  @UI.widget(Rendering.Widget.Checkbox)
  sameAsProjectDirector?: boolean;

  @Validation.requiredPaths("title", "email")
  @UI.label("Primary Contact / Grants Administrator")
  contactPerson: Questions.People.Person;

  @doc("Read the certifications above and check to select.")
  @UI.label("I Agree")
  @UI.widget(Rendering.Widget.Checkbox)
  applicationCertification: boolean;

  authorizedRepresentative: ShortRepresentative;
}

model ShortOpportunity {
  @doc("Pre-populated from the Application cover sheet.")
  @UI.label("Name of Federal Agency")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.agencyName)
  agencyName: Questions.Opportunities.AgencyName;

  @doc("Pre-populated from the Application cover sheet.")
  @UI.label("Assistance Listing Number")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.assistanceListingNumber)
  assistanceListingNumber?: Questions.Opportunities.AssistanceListingNumber;

  @doc("Pre-populated from the Application cover sheet.")
  @UI.label("Assistance Listing Title")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.assistanceListingTitle)
  assistanceListingProgramTitle?: Questions.Opportunities.AssistanceListingTitle;

  @doc("Pre-populated from the Application cover sheet.")
  @UI.label("Funding Opportunity Number")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.opportunityNumber)
  fundingOpportunityNumber: Questions.Opportunities.OpportunityNumber;

  @doc("Pre-populated from the Application cover sheet.")
  @UI.label("Funding Opportunity Title")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.opportunityTitle)
  fundingOpportunityTitle: Questions.Opportunities.OpportunityTitle;
}

model ShortApplicant {
  @UI.label("Legal Name")
  organizationName: Questions.Organizations.OrgName;

  @UI.label("Applicant address")
  address: Questions.Types.Address;

  @doc("Enter the applicant's web address, if applicable.")
  @UI.label("Web Address")
  @minLength(1)
  @maxLength(250)
  applicantWebAddress?: string;

  @doc("Select a minimum of one applicant type or select up to three applicant types in accordance with agency instructions. If “Other” is selected, then specify Other Type of Applicant in text box.")
  @UI.label("Type of Applicant")
  @UI.widget(Rendering.Widget.MultiSelect)
  @minItems(1)
  @maxItems(3)
  applicantTypeCode: Questions.Organizations.ApplicantType[];

  @doc("Enter the applicant type here if you selected \"Other (specify)\" for Type of applicant.")
  @UI.label("Type of Applicant Other Explanation")
  @Validation.requiredWhen(
    ShortApplicant.applicantTypeCode,
    Questions.Organizations.ApplicantType.X
  )
  @minLength(0)
  @maxLength(30)
  applicantTypeOtherSpecify?: string;

  @doc("Enter either TIN or EIN as assigned by the Internal Revenue Service.  If your organization is not in the US, enter 44-4444444.")
  @UI.label("EIN/TIN")
  @minLength(9)
  @maxLength(30)
  employerTaxpayerIdentificationNumber: string;

  @doc("UEI of the applicant organization. This field is pre-populated from the Application cover sheet.")
  @UI.label("UEI")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.uei)
  samUei: Questions.Organizations.OrgUei;

  @doc("Congressional District of Applicant is required: Enter the Congressional District in the format: 2 character State Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th District, CA-012 for California's 12th District, NC-103 for North Carolina's 103rd District. If outside the U.S., enter 00-000.")
  @UI.label("Congressional District of Applicant")
  @minLength(1)
  @maxLength(6)
  congressionalDistrictApplicant: string;
}

model ShortProject {
  @doc("Enter a brief, descriptive title of the project.")
  @UI.label("Project Title")
  title: Questions.Projects.ProjectTitle;

  @doc("Enter a brief description of the project.")
  @UI.label("Project Description")
  description: Questions.Projects.ProjectDescription;

  @doc("Enter the date in the format MM/DD/YYYY.")
  @UI.label("Start Date")
  startDate: Questions.Projects.ProjectStartDate;

  @doc("Enter the date in the format MM/DD/YYYY.")
  @UI.label("End Date")
  endDate: Questions.Projects.ProjectEndDate;
}

model ShortRepresentative {
  @UI.label("Authorized Representative")
  name: Questions.People.PersonName;

  @UI.label("Title")
  title: Questions.People.PersonTitle;

  @UI.label("Email")
  email: Questions.People.PersonEmail;

  @UI.label("Phone Number")
  phone: Questions.People.PersonPhoneNumber;

  @UI.label("Fax Number")
  fax?: Questions.People.PersonFaxNumber;

  @doc("Completed by Grants.gov upon submission.")
  @UI.label("Signature")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.signature)
  signature?: Questions.Certifications.Signature;

  @doc("Completed by Grants.gov upon submission.")
  @UI.label("Date Signed")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.currentDate)
  dateSigned?: Questions.Certifications.DateSigned;
}
