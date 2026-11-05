import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "#questions/certification/index.tsp";
import "#questions/opportunity/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/index.tsp";
import "#questions/project/index.tsp";
import "#questions/types/attachment.tsp";
import "#questions/organization/applicant-type.tsp";

using SimplerForms;
namespace Forms.SF424Regular;

// Preserve the existing API's monetary string representation and admission rules.
@minLength(1)
@maxLength(14)
@pattern("^(-)?\\d*([.]\\d{2})?$")
scalar RegularFundingAmount extends string;

enum RegularSubmissionType {
  Preapplication: "Preapplication",
  Application: "Application",
  Changed: "Changed/Corrected Application",
}

enum RegularApplicationType {
  New: "New",
  Continuation: "Continuation",
  Revision: "Revision",
}

enum RegularRevisionType {
  IncreaseAward: "A: Increase Award",
  DecreaseAward: "B: Decrease Award",
  IncreaseDuration: "C: Increase Duration",
  DecreaseDuration: "D: Decrease Duration",
  Other: "E: Other (specify)",
  IncreaseAwardAndDuration: "AC: Increase Award, Increase Duration",
  IncreaseAwardDecreaseDuration: "AD: Increase Award, Decrease Duration",
  DecreaseAwardIncreaseDuration: "BC: Decrease Award, Increase Duration",
  DecreaseAwardAndDuration: "BD: Decrease Award, Decrease Duration",
}

enum RegularStateReviewStatus {
  Available: "a. This application was made available to the State under the Executive Order 12372 Process for review on",
  NotSelected: "b. Program is subject to E.O. 12372 but has not been selected by the State for review.",
  NotCovered: "c. Program is not covered by E.O. 12372.",
}

model RegularApplication {
  @doc("Select one type of submission in accordance with agency instructions.")
  @UI.label("Submission Type")
  @UI.widget(Rendering.Widget.Radio)
  submissionType: RegularSubmissionType;

  @doc("Select one type of application in accordance with agency instructions.")
  @UI.label("Application Type")
  @UI.widget(Rendering.Widget.Radio)
  applicationType: RegularApplicationType;

  @doc("Select a revision type from the list provided. A selection is required if Type of Application is Revision.")
  @UI.label("Revision Type")
  @Validation.requiredWhen(
    RegularApplication.applicationType,
    RegularApplicationType.Revision
  )
  @UI.enabledWhen(
    RegularApplication.applicationType,
    RegularApplicationType.Revision
  )
  revisionType?: RegularRevisionType;

  @doc("Please specify the type of revision. This field is required if E. Other is checked.")
  @UI.label("Other Explanation")
  @Validation.requiredWhen(
    RegularApplication.revisionType,
    RegularRevisionType.Other
  )
  @UI.enabledWhen(RegularApplication.revisionType, RegularRevisionType.Other)
  @minLength(0)
  @maxLength(21)
  revisionOtherSpecify?: string;

  @doc("Completed by Grants.gov upon submission.")
  @UI.label("Date Received")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.currentDate)
  dateReceived?: plainDate;

  @doc("Enter the applicant's control number, if applicable.")
  @UI.label("Applicant Identifier")
  @minLength(1)
  @maxLength(30)
  applicantId?: string;

  @doc("Enter the number assigned to your organization by the Federal agency.")
  @UI.label("Federal Entity Identifier")
  @minLength(1)
  @maxLength(30)
  federalEntityIdentifier?: string;

  @doc("For new applications leave blank. For a continuation or revision to an existing award, enter the previously assigned Federal award identifier number. If a changed/corrected application, enter the Federal Identifier in accordance with agency instructions.")
  @UI.label("Federal Award Identifier")
  @Validation.requiredWhen(
    RegularApplication.applicationType,
    RegularApplicationType.Revision
  )
  @Validation.requiredWhen(
    RegularApplication.applicationType,
    RegularApplicationType.Continuation
  )
  @minLength(1)
  @maxLength(25)
  federalAwardIdentifier?: string;

  @doc("Leave blank, to be filled out by state.")
  @UI.label("Date Received By State")
  stateReceiveDate?: plainDate;

  @doc("Leave blank, to be filled out by state.")
  @UI.label("State Application Identifier")
  @minLength(0)
  @maxLength(30)
  stateApplicationId?: string;
}

model RegularApplicant {
  @doc("Enter the legal name of the applicant that will undertake the assistance activity. This is the organization that has registered with the System for Award Management (SAM). Information on registering with SAM may be obtained by visiting SAM.gov.")
  @UI.label("Legal Name")
  legalName: Questions.Organizations.OrgName;

  @doc("Enter either TIN or EIN as assigned by the Internal Revenue Service.  If your organization is not in the US, enter 44-4444444.")
  @UI.label("EIN/TIN")
  @minLength(9)
  @maxLength(30)
  ein: string;

  @doc("UEI of the applicant organization. This field is pre-populated from the Application cover sheet.")
  @UI.label("UEI")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.uei)
  uei: Questions.Organizations.OrgUei;

  @doc("Enter information about the applicant.")
  @UI.label("Address")
  address: Questions.Types.Address;

  @doc("Enter the name of primary organizational department, service, laboratory, or equivalent level within the organization which will undertake the assistance activity.")
  @UI.label("Department Name")
  @minLength(1)
  @maxLength(30)
  departmentName?: string;

  @doc("Enter the name of primary organizational division, office, or major subdivision which will undertake the assistance activity.")
  @UI.label("Division Name")
  @minLength(1)
  @maxLength(30)
  divisionName?: string;
}

model RegularContact {
  @doc("Enter information about the contact person.")
  @UI.label("Name")
  name: Questions.People.PersonName;

  @doc("Enter the position title.")
  @UI.label("Title")
  title?: Questions.People.PersonTitle;

  @doc("Enter the organization if different from the applicant organization.")
  @UI.label("Organizational Affiliation")
  @minLength(1)
  @maxLength(60)
  organizationalAffiliation?: string;

  @doc("Enter the daytime Telephone Number.")
  @UI.label("Phone Number")
  phone: Questions.People.PersonPhoneNumber;

  @doc("Enter the fax Number.")
  @UI.label("Fax Number")
  fax?: Questions.People.PersonFaxNumber;

  @doc("Enter a valid email Address.")
  @UI.label("Email")
  email: Questions.People.PersonEmail;
}

model RegularApplicantType {
  @doc("Select the appropriate applicant types.")
  @UI.label("Type of Applicant")
  @UI.widget(Rendering.Widget.MultiSelect)
  @minItems(1)
  @maxItems(3)
  codes: Questions.Organizations.ApplicantType[];

  @doc("Enter the applicant type here if you selected \"Other (specify)\" for Type of applicant.")
  @UI.label("Type of Applicant Other Explanation")
  @Validation.requiredWhen(
    RegularApplicantType.codes,
    Questions.Organizations.ApplicantType.X
  )
  @minLength(0)
  @maxLength(30)
  otherExplanation?: string;
}

model RegularOpportunity {
  @doc("Pre-populated from the Application cover sheet.")
  @UI.label("Agency Name")
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
  assistanceListingTitle?: Questions.Opportunities.AssistanceListingTitle;

  @doc("Pre-populated from the Application cover sheet.")
  @UI.label("Opportunity Number")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.opportunityNumber)
  number: Questions.Opportunities.OpportunityNumber;

  @doc("Pre-populated from the Application cover sheet.")
  @UI.label("Opportunity title")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.opportunityTitle)
  title: Questions.Opportunities.OpportunityTitle;

  @doc("Pre-populated from the Application cover sheet.")
  @UI.label("Competition Number")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.competitionId)
  @minLength(1)
  @maxLength(40)
  competitionNumber?: string;

  @doc("Pre-populated from the Application cover sheet.")
  @UI.label("Competition Title")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.competitionTitle)
  @minLength(1)
  @maxLength(255)
  competitionTitle?: string;
}

model RegularProject {
  @doc("List the areas or entities using the categories (e.g., cities, counties, states, etc.) specified in agency instructions.")
  @UI.label("Areas Affected")
  areasAffected?: Questions.Types.Attachment;

  @doc("Enter a brief, descriptive title of the project.")
  @UI.label("Project Title")
  title: Questions.Projects.ProjectTitle;

  @doc("Attach file(s) using the appropriate buttons.")
  @UI.label("Additional Project Title")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @maxItems(100)
  additionalProjectTitle?: Questions.Types.Attachment[];

  @doc("Enter the Congressional District in the format: 2 character state Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district.If outside the US, enter 00-000.")
  @UI.label("Applicant District")
  congressionalDistrictApplicant: Questions.People.PersonCongressionalDistrict;

  @doc("Enter the Congressional District in the format: 2 character state Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district.If all districts in a state are affected, enter \"all\" for the district number. Example: MD-all for all congressional districts in Maryland.If nationwide (all districts in all states), enter US-all.If the program/project is outside the US, enter 00-000.")
  @UI.label("Program District")
  congressionalDistrictProgramProject: Questions.People.PersonCongressionalDistrict;

  @doc("Attach an additional list of Program/Project Congressional Districts if needed.")
  @UI.label("Additional Congressional Districts")
  additionalCongressionalDistricts?: Questions.Types.Attachment;

  @doc("Enter the date in the format MM/DD/YYYY. ")
  @UI.label("Project Start Date")
  startDate: Questions.Projects.ProjectStartDate;

  @doc("Enter the date in the format MM/DD/YYYY. ")
  @UI.label("Project End Date")
  @Validation.notBefore(RegularProject.startDate)
  endDate: Questions.Projects.ProjectEndDate;
}

model RegularFunding {
  @doc("Enter the dollar amount.")
  @UI.label("Federal Estimated Funding")
  federal: RegularFundingAmount;

  @doc("Enter the dollar amount.")
  @UI.label("Applicant Estimated Funding")
  applicant: RegularFundingAmount;

  @doc("Enter the dollar amount.")
  @UI.label("State Estimated Funding")
  state: RegularFundingAmount;

  @doc("Enter the dollar amount.")
  @UI.label("Local Estimated Funding")
  local: RegularFundingAmount;

  @doc("Enter the dollar amount.")
  @UI.label("Other Estimated Funding")
  other: RegularFundingAmount;

  @doc("Enter the dollar amount.")
  @UI.label("Program Income Estimated Funding")
  programIncome: RegularFundingAmount;

  @doc("This field is automatically calculated by Grants.gov")
  @UI.label("Total Estimated Funding")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  total?: RegularFundingAmount;
}

model RegularStateReview {
  @doc("One selection is required.")
  @UI.label("Is Application Subject to Review By State Under Executive Order 12372 Process?")
  @UI.widget(Rendering.Widget.Radio)
  status: RegularStateReviewStatus;

  @doc("If 'a' is selected, enter the date the application was submitted to the State.")
  @UI.label("State Review Date")
  @Validation.requiredWhen(
    RegularStateReview.status,
    RegularStateReviewStatus.Available
  )
  @UI.enabledWhen(RegularStateReview.status, RegularStateReviewStatus.Available)
  availableDate?: plainDate;
}

model RegularDebt {
  @doc("If 'Yes,' provide explanation in attachment.")
  @UI.label("Applicant Delinquent on Federal Debt")
  @UI.widget(Rendering.Widget.Radio)
  isDelinquent: boolean;

  @UI.label("Debt Explanation")
  @Validation.requiredWhen(RegularDebt.isDelinquent, true)
  @UI.enabledWhen(RegularDebt.isDelinquent, true)
  explanation?: Questions.Types.Attachment;
}

model RegularCertification {
  @doc("By signing this application, I certify (1) to the statements contained in the list of certifications* and (2) that the statements herein are true, complete and accurate to the best of my knowledge. I also provide the required assurances** and agree to comply with any resulting terms if I accept an award. I am aware that any false, fictitious, or fraudulent statements or claims may subject me to criminal, civil, or administrative penalties. (U.S. Code, Title 18, Section 1001)")
  @UI.label("I Agree")
  @UI.widget(Rendering.Widget.Checkbox)
  agree: boolean;
}

model RegularRepresentative {
  @UI.label("Name")
  name: Questions.People.PersonName;

  @doc("Enter the position title.")
  @UI.label("Title")
  title: Questions.People.PersonTitle;

  @doc("Enter the daytime Telephone Number.")
  @UI.label("Phone Number")
  phone: Questions.People.PersonPhoneNumber;

  @doc("Enter a valid email Address.")
  @UI.label("Email")
  email: Questions.People.PersonEmail;

  @doc("Enter the fax Number.")
  @UI.label("Fax Number")
  fax?: Questions.People.PersonFaxNumber;

  @UI.label("Signature")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.signature)
  signature?: Questions.Certifications.Signature;

  @UI.label("Date Signed")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.currentDate)
  dateSigned?: Questions.Certifications.DateSigned;
}
