import "simpler-forms";
import "simpler-forms-sgg";
import "@typespec/json-schema";
import "#forms/index.tsp";
import "#questions/opportunity/index.tsp";
import "#questions/certification/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/index.tsp";
import "#questions/types/attachment.tsp";

using SimplerForms;
namespace Forms.SF424Mandatory;

enum MandatorySubmissionType {
  Application,
  Plan,
  FundingRequest,
  Other,
}
enum MandatoryFrequency {
  Annual,
  Quarterly,
  Other,
}
enum MandatorySubmissionVersion {
  Initial,
  Resubmission,
  Revision,
  Update,
}
enum MandatoryStateReviewStatus {
  Available: "StateReviewAvailable",
  NotSelected: "StateReviewNotSelected",
  NotNeeded: "StateReviewNotNeeded",
}

// XSD BudgetAmountDataType. Kept local until another source-matched consumer is reviewed.
@minValue(0)
@maxValue(999999999999.99)
@JsonSchema.multipleOf(0.01)
scalar MandatoryFundingAmount extends float64;

enum MandatoryApplicantTypeCode {
  A: "A: State Government",
  B: "B: County Government",
  C: "C: City or Township Government",
  D: "D: Special District Government",
  E: "E: Regional Organization",
  F: "F: U.S. Territory or Possession",
  G: "G: Independent School District",
  H: "H: Public/State Controlled Institution of Higher Education",
  I: "I: Indian/Native American Tribal Government (Federally Recognized)",
  J: "J: Indian/Native American Tribal Government (Other than Federally Recognized)",
  K: "K: Indian/Native American Tribally Designated Organization",
  L: "L: Public/Indian Housing Authority",
  M: "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)",
  N: "N: Nonprofit without 501C3 IRS Status (Other than Institution of Higher Education)",
  O: "O: Private Institution of Higher Education",
  P: "P: Individual",
  Q: "Q: For-Profit Organization (Other than Small Business)",
  R: "R: Small Business",
  S: "S: Hispanic-serving Institution",
  T: "T: Historically Black Colleges and Universities (HBCUs)",
  U: "U: Tribally Controlled Colleges and Universities (TCCUs)",
  V: "V: Alaska Native and Native Hawaiian Serving Institutions",
  W: "W: Non-domestic (non-US) Entity",
  X: "X: Other (specify)",
}

model MandatorySubmission {
  @doc("Select one type of submission in accordance with agency instructions.  This field is required.")
  @UI.label("Type of Submission")
  @UI.widget(Rendering.Widget.Select)
  type: MandatorySubmissionType;

  @doc("Specify the type of submission in the text box.")
  @UI.label("Type of Submission - Other (specify)")
  @minLength(1)
  @maxLength(50)
  @UI.widget(Rendering.Widget.TextArea)
  @UI.enabledWhen(MandatorySubmission.type, MandatorySubmissionType.Other)
  @Validation.requiredWhen(
    MandatorySubmission.type,
    MandatorySubmissionType.Other
  )
  typeOtherDescription?: string;

  @doc("Select the applicable frequency for the type of submission.  This field is required.")
  @UI.label("Frequency")
  @UI.widget(Rendering.Widget.Select)
  frequency: MandatoryFrequency;

  @doc("Specify the frequency of the submission.")
  @UI.label("Frequency - Other (specify)")
  @minLength(1)
  @maxLength(50)
  @UI.widget(Rendering.Widget.TextArea)
  @UI.enabledWhen(MandatorySubmission.frequency, MandatoryFrequency.Other)
  @Validation.requiredWhen(
    MandatorySubmission.frequency,
    MandatoryFrequency.Other
  )
  frequencyOtherDescription?: string;

  @doc("Indicate if the submission is a consolidated application/plan/funding request.")
  @UI.label("Consolidated Application/Plan/Funding Request?")
  @UI.widget(Rendering.Widget.Radio)
  consolidatedRequest?: boolean;

  @doc("If this is a Consolidated Application/Plan/Funding Request, please identify the programs covered by the consolidated submission as required in agency instructions.")
  @UI.label("Consolidated Request Explanation")
  @minLength(1)
  @maxLength(4000)
  @UI.widget(Rendering.Widget.TextArea)
  @UI.enabledWhen(MandatorySubmission.consolidatedRequest, true)
  @Validation.requiredWhen(MandatorySubmission.consolidatedRequest, true)
  consolidatedRequestExplanation?: string;

  @doc("Select the applicable version for the type of submission.  This field is required.")
  @UI.label("Version")
  @UI.widget(Rendering.Widget.Select)
  version: MandatorySubmissionVersion;
}

model MandatoryDates {
  @doc("Completed by Grants.gov upon submission.")
  @UI.label("Date Received")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.currentDate)
  receivedDate?: plainDate;

  @doc("Enter the date received by the State, if applicable.  Enter in the format mm/dd/yyyy.")
  @UI.label("Date Received by State")
  stateReceivedDate?: plainDate;
}

model MandatoryIdentifiers {
  @doc("If you wish to use a unique identification number for your own purposes, enter it here.")
  @UI.label("Applicant Identifier")
  @minLength(0)
  @maxLength(30)
  applicantId?: string;

  @doc("Enter the number assigned to your organization by the Federal agency.")
  @UI.label("Federal Entity Identifier")
  @minLength(1)
  @maxLength(30)
  federalEntityId?: string;

  @doc("Enter the award number previously assigned by the Federal agency, if any.")
  @UI.label("Federal Award Identifier")
  @minLength(1)
  @maxLength(25)
  federalAwardId?: string;

  @doc("Enter the identifier assigned by the State, if applicable.")
  @UI.label("State Application Identifier")
  @minLength(0)
  @maxLength(30)
  stateApplicationId?: string;
}

model MandatoryApplicant {
  @doc("Enter the legal name of the organization.")
  @UI.label("Legal Name")
  legalName: Questions.Organizations.OrgName;

  @doc("Enter either TIN or EIN as assigned by the Internal Revenue Service.  If your organization is not in the US, enter 44-4444444.  This field is required.")
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

  address: Questions.Organizations.OrgAddress;

  @doc("Enter the name of primary organizational department, service, laboratory, or equivalent level within the organization which will undertake the assistance activity.")
  @UI.label("Department Name")
  @minLength(1)
  @maxLength(30)
  department?: string;

  @doc("Enter the name of primary organizational division, office, or major subdivision which will undertake the assistance activity.")
  @UI.label("Division Name")
  @minLength(1)
  @maxLength(30)
  division?: string;

  type: MandatoryApplicantType;
}

model MandatoryApplicantType {
  @doc("Select the appropriate applicant type code.  This field is required.")
  @UI.label("Type of Applicant")
  @UI.widget(Rendering.Widget.Select)
  code: MandatoryApplicantTypeCode;

  @doc("If you selected \"Other\" in 8a, specify your applicant type here.")
  @UI.label("Other (specify)")
  @minLength(1)
  @maxLength(50)
  @UI.enabledWhen(MandatoryApplicantType.code, MandatoryApplicantTypeCode.X)
  @Validation.requiredWhen(
    MandatoryApplicantType.code,
    MandatoryApplicantTypeCode.X
  )
  otherSpecify?: string;

  @doc("Enter a secondary description of applicant type, if required by the agency.")
  @UI.label("Additional Description")
  @minLength(0)
  @maxLength(50)
  @UI.widget(Rendering.Widget.TextArea)
  additionalDescription?: string;
}

model MandatoryContact {
  name: Questions.People.PersonName;
  title?: Questions.People.PersonTitle;

  @doc("Enter the legal name of the organization.")
  @UI.label("Organizational Affiliation")
  organizationalAffiliation?: Questions.Organizations.OrgName;

  phone: Questions.People.PersonPhoneNumber;
  fax?: Questions.People.PersonFaxNumber;
  email: Questions.People.PersonEmail;
}

model MandatoryOpportunity {
  @doc("The federal agency providing the funding opportunity.")
  @UI.label("Name of Federal Agency")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.agencyName)
  agencyName: Questions.Opportunities.AgencyName;

  assistanceListing?: MandatoryAssistanceListing;
}

model MandatoryAssistanceListing {
  @doc("The assistance listing number associated with this competition.")
  @UI.label("Assistance Listing Number")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.assistanceListingNumber)
  number?: Questions.Opportunities.AssistanceListingNumber;

  @doc("The program title associated with the assistance listing.")
  @UI.label("Assistance Listing Title")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.assistanceListingTitle)
  title?: Questions.Opportunities.AssistanceListingTitle;
}

model MandatoryProject {
  @doc("Enter a descriptive title of the project. This field is required.")
  @UI.label("Descriptive Title of Applicant's Project")
  @minLength(1)
  @maxLength(250)
  title: string;

  @doc("Enter areas or entities affected using categories specified in the agency instructions.")
  @UI.label("Areas Affected by Funding")
  @minLength(0)
  @maxLength(250)
  @UI.widget(Rendering.Widget.TextArea)
  areasAffected?: string;
}

model MandatoryCongressionalDistricts {
  @doc("Enter the Congressional District as a two-character state abbreviation, a hyphen and a three-digit district number (for example, CA-005). If outside the US, enter 00-000.")
  @UI.label("Applicant Congressional District")
  applicant: Questions.People.PersonCongressionalDistrict;

  @doc("Enter the Congressional District as a two-character state abbreviation, a hyphen and a three-digit district number (for example, CA-005). If outside the US, enter 00-000.")
  @UI.label("Program/Project Congressional District")
  project?: Questions.People.PersonCongressionalDistrict;

  @doc("Attach a file listing additional congressional districts.")
  @UI.label("Additional Congressional Districts Attachment")
  additionalAttachment?: Questions.Types.Attachment;
}

model MandatoryFunding {
  @doc("Enter the start date of the funding period for this submission. Enter in the format mm/dd/yyyy. This field is required.")
  @UI.label("Funding Period Start Date")
  startDate: plainDate;

  @doc("Enter the end date of the funding period for this submission. Enter in the format mm/dd/yyyy. This field is required.")
  @UI.label("Funding Period End Date")
  @Validation.notBefore(MandatoryFunding.startDate)
  endDate: plainDate;

  @doc("Enter the dollar amount.  This field is required.")
  @UI.label("Estimated Funding - Federal")
  estimatedFederal: MandatoryFundingAmount;

  @doc("Enter the dollar amount.")
  @UI.label("Estimated Funding - Match")
  estimatedMatch?: MandatoryFundingAmount;
}

model MandatoryStateReview {
  @doc("Applicants should contact the State Single Point of Contact (SPOC) for Federal Executive Order 12372 to determine whether the application is subject to the State intergovernmental review process.   This field is required.")
  @UI.label("Is Submission Subject to Review by State Under Executive Order 12372?")
  @UI.widget(Rendering.Widget.Select)
  status: MandatoryStateReviewStatus;

  @doc("Enter the date the submission was provided to the State for review.  Enter in the format mm/dd/yyyy.")
  @UI.label("State Review Available Date")
  @UI.enabledWhen(
    MandatoryStateReview.status,
    MandatoryStateReviewStatus.Available
  )
  @Validation.requiredWhen(
    MandatoryStateReview.status,
    MandatoryStateReviewStatus.Available
  )
  availableDate?: plainDate;
}

model MandatoryDebt {
  @doc("This question applies to the applicant organization, not the person who signs as the authorized representative.  This field is required.")
  @UI.label("Is the Applicant Delinquent on Any Federal Debt?")
  @UI.widget(Rendering.Widget.Radio)
  isDelinquent: boolean;

  @doc("Provide an explanation of Delinquent Federal Debt in the text box.")
  @UI.label("Federal Debt Delinquency Explanation")
  @minLength(1)
  @maxLength(4000)
  @UI.widget(Rendering.Widget.TextArea)
  @UI.enabledWhen(MandatoryDebt.isDelinquent, true)
  @Validation.requiredWhen(MandatoryDebt.isDelinquent, true)
  explanation?: string;
}

model MandatoryCertification {
  @doc("Check to select.  This field is required.")
  @UI.label("Application Certification (I Agree)")
  @UI.widget(Rendering.Widget.Checkbox)
  agree: true;
}

model MandatoryAuthorizedRepresentative {
  name: Questions.People.PersonName;
  title: Questions.People.PersonTitle;

  @doc("Enter the legal name of the organization.")
  @UI.label("Organizational Affiliation")
  organizationalAffiliation?: Questions.Organizations.OrgName;

  phone: Questions.People.PersonPhoneNumber;
  fax?: Questions.People.PersonFaxNumber;
  email: Questions.People.PersonEmail;

  @doc("Completed by Grants.gov upon submission.")
  @UI.label("Signature of Authorized Representative")
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
