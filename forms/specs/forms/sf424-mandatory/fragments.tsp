import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#questions/application/index.tsp";
import "#questions/certification/index.tsp";
import "#questions/opportunity/index.tsp";
import "#questions/organization/applicant-type.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/index.tsp";
import "#questions/types/address.tsp";
import "#questions/types/attachment.tsp";
import "#questions/types/budget.tsp";
import "#questions/types/congressional-district.tsp";
import "#questions/types/yes-no.tsp";

using SimplerForms;

namespace Forms.SF424Mandatory;

// =============================================================================
// OPPORTUNITY
// =============================================================================

// The funding opportunity, pre-populated from the application package.
model MandatoryOpportunity {
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.agencyName)
  agencyName: Questions.Opportunities.AgencyName;

  assistanceListing?: Questions.Opportunities.AssistanceListing;
}

// =============================================================================
// APPLICATION
// =============================================================================

// The submission itself, and the fields Grants.gov and the state fill in.
model MandatoryApplication {
  /** Select one type of submission in accordance with agency instructions.  This field is required. */
  @UI.widget(Rendering.Widget.Select)
  submissionType: MandatorySubmissionType;

  /** Specify the type of submission in the text box. */
  @minLength(1)
  @maxLength(50)
  @UI.widget(Rendering.Widget.TextArea)
  @UI.enabledWhen(
    MandatoryApplication.submissionType,
    MandatorySubmissionType.Other
  )
  @Validation.requiredWhen(
    MandatoryApplication.submissionType,
    MandatorySubmissionType.Other
  )
  submissionTypeOther?: string;

  frequency: MandatoryFrequency;
  consolidatedRequest?: MandatoryConsolidatedRequest;

  /** Select the applicable version for the type of submission.  This field is required. */
  @UI.widget(Rendering.Widget.Select)
  version: MandatorySubmissionVersion;

  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.currentDate)
  dateReceived?: Questions.Applications.DateReceived;

  /** If you wish to use a unique identification number for your own purposes, enter it here. */
  applicantId?: Questions.Applications.ApplicantId;

  /** Enter the number assigned to your organization by the Federal agency. */
  federalEntityIdentifier?: Questions.Applications.FederalId;

  /** Enter the award number previously assigned by the Federal agency, if any. */
  federalAwardIdentifier?: Questions.Applications.FederalAwardId;

  state?: MandatoryApplicationState;
  stateReview: MandatoryStateReview;
}

// How often the applicant submits: item 1.b.
model MandatoryFrequency {
  /** Select the applicable frequency for the type of submission.  This field is required. */
  @UI.widget(Rendering.Widget.Select)
  code: MandatoryFrequencyCode;

  /** Specify the frequency of the submission. */
  @minLength(1)
  @maxLength(50)
  @UI.widget(Rendering.Widget.TextArea)
  @UI.enabledWhen(MandatoryFrequency.code, MandatoryFrequencyCode.Other)
  @Validation.requiredWhen(
    MandatoryFrequency.code,
    MandatoryFrequencyCode.Other
  )
  other?: string;
}

// Whether the submission combines several programs: item 1.c.
model MandatoryConsolidatedRequest {
  /** Indicate if the submission is a consolidated application/plan/funding request. */
  answer?: Questions.Types.YesNo;

  /** If this is a Consolidated Application/Plan/Funding Request, please identify the programs covered by the consolidated submission as required in agency instructions. */
  @minLength(1)
  @maxLength(4000)
  @UI.widget(Rendering.Widget.TextArea)
  @UI.enabledWhen(MandatoryConsolidatedRequest.answer, true)
  @Validation.requiredWhen(MandatoryConsolidatedRequest.answer, true)
  explanation?: string;
}

// The state's receipt of the submission: items 5 and 6.
model MandatoryApplicationState {
  /** Enter the date received by the State, if applicable.  Enter in the format mm/dd/yyyy. */
  receivedDate?: Questions.Applications.StateReceivedDate;

  /** Enter the identifier assigned by the State, if applicable. */
  applicationId?: Questions.Applications.StateApplicationId;
}

// Review by the state under Executive Order 12372: item 16.
model MandatoryStateReview {
  /** Applicants should contact the State Single Point of Contact (SPOC) for Federal Executive Order 12372 to determine whether the application is subject to the State intergovernmental review process.   This field is required. */
  @UI.widget(Rendering.Widget.Select)
  status: MandatoryStateReviewStatus;

  /** Enter the date the submission was provided to the State for review.  Enter in the format mm/dd/yyyy. */
  @UI.enabledWhen(
    MandatoryStateReview.status,
    MandatoryStateReviewStatus.Available
  )
  @Validation.requiredWhen(
    MandatoryStateReview.status,
    MandatoryStateReviewStatus.Available
  )
  date?: plainDate;
}

enum MandatorySubmissionType {
  Application,
  Plan,
  FundingRequest,
  Other,
}

enum MandatoryFrequencyCode {
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

// =============================================================================
// APPLICANT
// =============================================================================

// The applicant organization, its type, its district, and its federal debt.
model MandatoryApplicant {
  organization: MandatoryApplicantOrganization;
  type: MandatoryApplicantType;

  /** Enter the Congressional District as a two-character state abbreviation, a hyphen and a three-digit district number (for example, CA-005). If outside the US, enter 00-000. */
  congressionalDistrict: Questions.Types.CongressionalDistrictCode;

  delinquentFederalDebt: MandatoryDelinquentFederalDebt;
}

// `globLib:OrganizationDataTypeV4`, whose department and division are the 30-character V1 types.
model MandatoryApplicantOrganization {
  name: Questions.Organizations.OrgName;

  /** UEI of the applicant organization. This field is pre-populated from the Application cover sheet. */
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.uei)
  uei: Questions.Organizations.OrgUei;

  /** Enter either TIN or EIN as assigned by the Internal Revenue Service.  If your organization is not in the US, enter 44-4444444.  This field is required. */
  ein: Questions.Organizations.OrgEin;

  address: Questions.Types.AddressZipPlusFour;

  /** Enter the name of primary organizational department, service, laboratory, or equivalent level within the organization which will undertake the assistance activity. */
  @maxLength(30)
  department?: Questions.Organizations.OrgDepartment;

  /** Enter the name of primary organizational division, office, or major subdivision which will undertake the assistance activity. */
  @maxLength(30)
  division?: Questions.Organizations.OrgDivision;
}

// One applicant type code, with text for "Other" and an optional secondary description.
model MandatoryApplicantType {
  /** Select the appropriate applicant type code.  This field is required. */
  @UI.widget(Rendering.Widget.Select)
  code: Questions.Organizations.ApplicantType;

  /** If you selected "Other" in 8a, specify your applicant type here. */
  @minLength(1)
  @maxLength(50)
  @UI.enabledWhen(
    MandatoryApplicantType.code,
    Questions.Organizations.ApplicantType.X
  )
  @Validation.requiredWhen(
    MandatoryApplicantType.code,
    Questions.Organizations.ApplicantType.X
  )
  otherSpecify?: string;

  /** Enter a secondary description of applicant type, if required by the agency. */
  @minLength(0)
  @maxLength(50)
  @UI.widget(Rendering.Widget.TextArea)
  additionalDescription?: string;
}

// Item 17. The XSD takes the explanation as text, not an attachment.
model MandatoryDelinquentFederalDebt {
  /** This question applies to the applicant organization, not the person who signs as the authorized representative.  This field is required. */
  answer: Questions.Types.YesNo;

  /** Provide an explanation of Delinquent Federal Debt in the text box. */
  @minLength(1)
  @maxLength(4000)
  @UI.widget(Rendering.Widget.TextArea)
  @UI.enabledWhen(MandatoryDelinquentFederalDebt.answer, true)
  @Validation.requiredWhen(MandatoryDelinquentFederalDebt.answer, true)
  explanation?: string;
}

// =============================================================================
// PROJECT
// =============================================================================

// The project the funding pays for. The XSD takes areas affected as text, not an attachment.
model MandatoryProject {
  /** Enter a descriptive title of the project. This field is required. */
  @minLength(1)
  @maxLength(250)
  title: string;

  /** Enter areas or entities affected using categories specified in the agency instructions. */
  @minLength(0)
  @maxLength(250)
  @UI.widget(Rendering.Widget.TextArea)
  areasAffected?: string;

  /** Enter the Congressional District as a two-character state abbreviation, a hyphen and a three-digit district number (for example, CA-005). If outside the US, enter 00-000. */
  congressionalDistrict?: Questions.Types.CongressionalDistrictCode;

  /** Attach a file listing additional congressional districts. */
  additionalCongressionalDistricts?: Questions.Types.Attachment;
}

// =============================================================================
// CONTACTS
// =============================================================================

// The person who signs, and the person to contact about the submission.
model MandatoryContacts {
  authorizedRepresentative: MandatoryAuthorizedRepresentative;
  pointOfContact: MandatoryPointOfContact;
}

// The authorized representative. The certification records their signature.
model MandatoryAuthorizedRepresentative {
  name: Questions.People.PersonName;
  title: Questions.People.PersonTitle;
  organization?: MandatoryRepresentativeOrganization;
  phone: Questions.People.PersonPhoneNumber;
  fax?: Questions.People.PersonFaxNumber;
  email: Questions.People.PersonEmail;
}

// The person to contact on matters involving this submission: item 7.f.
model MandatoryPointOfContact {
  name: Questions.People.PersonName;
  title?: Questions.People.PersonTitle;
  organization?: MandatoryContactOrganization;
  phone: Questions.People.PersonPhoneNumber;
  fax?: Questions.People.PersonFaxNumber;
  email: Questions.People.PersonEmail;
}

// A person's organization. The XSD asks only its name.
model MandatoryPersonOrganization {
  name?: Questions.People.PersonOrganizationalAffiliation;
}

// Give each role its own copy, so each XSD element maps from one field.
model MandatoryRepresentativeOrganization is MandatoryPersonOrganization;
model MandatoryContactOrganization is MandatoryPersonOrganization;

// =============================================================================
// BUDGET
// =============================================================================

// The estimated funding and the period it covers: items 14 and 15.
model MandatoryBudget {
  fundingSources: MandatoryFundingSources;
  fundingPeriod: MandatoryFundingPeriod;
}

model MandatoryFundingSources {
  /** Enter the dollar amount.  This field is required. */
  federal: Questions.Types.BudgetAmount;

  /** Enter the dollar amount. */
  match?: Questions.Types.BudgetAmount;
}

// The period the funds cover, which the DAT calls the funding period for this submission.
// Ask it with local dates, since it isn't the project's start and end.
model MandatoryFundingPeriod {
  /** Enter the start date of the funding period for this submission. Enter in the format mm/dd/yyyy. This field is required. */
  startDate: plainDate;

  /** Enter the end date of the funding period for this submission. Enter in the format mm/dd/yyyy. This field is required. */
  @Validation.notBefore(MandatoryFundingPeriod.startDate)
  endDate: plainDate;
}

// =============================================================================
// ATTACHMENTS
// =============================================================================

model MandatoryAttachments {
  /** Attach supporting documents as specified in agency instructions. */
  @UI.widget(Rendering.Widget.AttachmentArray)
  @maxItems(100)
  additional?: Questions.Types.Attachment[];
}
