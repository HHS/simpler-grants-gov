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
import "#questions/types/attachment.tsp";
import "#questions/types/budget.tsp";
import "#questions/types/congressional-district.tsp";
import "#questions/types/yes-no.tsp";

using SimplerForms;
namespace Forms.SF424Regular;

// =============================================================================
// OPPORTUNITY
// =============================================================================

// The funding opportunity, pre-populated from the application cover sheet.
model SF424Opportunity {
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

  competition?: SF424Competition;
}

model SF424Competition {
  /** Pre-populated from the Application cover sheet. */
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.competitionId)
  number?: Questions.Opportunities.CompetitionNumber;

  /** Pre-populated from the Application cover sheet. */
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.competitionTitle)
  title?: Questions.Opportunities.CompetitionTitle;
}

// =============================================================================
// APPLICATION
// =============================================================================

enum SF424SubmissionType {
  Preapplication: "Preapplication",
  Application: "Application",
  Changed: "Changed/Corrected Application",
}

enum SF424ApplicationType {
  New: "New",
  Continuation: "Continuation",
  Revision: "Revision",
}

enum SF424RevisionType {
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

enum SF424StateReviewStatus {
  Available: "a. This application was made available to the State under the Executive Order 12372 Process for review on",
  NotSelected: "b. Program is subject to E.O. 12372 but has not been selected by the State for review.",
  NotCovered: "c. Program is not covered by E.O. 12372.",
}

// The submission itself, including the fields the agency and the state fill in.
model SF424Application {
  /** Select one type of submission in accordance with agency instructions. */
  @UI.widget(Rendering.Widget.Radio)
  submissionType: SF424SubmissionType;

  /** Select one type of application in accordance with agency instructions. */
  @UI.widget(Rendering.Widget.Radio)
  applicationType: SF424ApplicationType;

  revision?: SF424Revision;

  /** Completed by Grants.gov upon submission. */
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.currentDate)
  dateReceived?: Questions.Applications.DateReceived;

  /** Enter the applicant's control number, if applicable. */
  applicantId?: Questions.Applications.ApplicantId;

  /** Enter the number assigned to your organization by the Federal agency. */
  federalEntityIdentifier?: Questions.Applications.FederalId;

  /** For new applications leave blank. For a continuation or revision to an existing award, enter the previously assigned Federal award identifier number. If a changed/corrected application, enter the Federal Identifier in accordance with agency instructions. */
  @Validation.requiredWhen(
    SF424Application.applicationType,
    SF424ApplicationType.Revision
  )
  @Validation.requiredWhen(
    SF424Application.applicationType,
    SF424ApplicationType.Continuation
  )
  federalAwardIdentifier?: Questions.Applications.FederalAwardId;

  state?: SF424StateApplication;
  stateReview: SF424StateReview;
}

model SF424Revision {
  /** Select a revision type from the list provided. A selection is required if Type of Application is Revision. */
  type?: SF424RevisionType;

  /** Please specify the type of revision. This field is required if E. Other is checked. */
  @Validation.requiredWhen(SF424Revision.type, SF424RevisionType.Other)
  @UI.enabledWhen(SF424Revision.type, SF424RevisionType.Other)
  @minLength(0)
  @maxLength(21)
  otherSpecify?: string;
}

model SF424StateApplication {
  /** Leave blank, to be filled out by state. */
  receivedDate?: Questions.Applications.StateReceivedDate;

  /** Leave blank, to be filled out by state. */
  applicationId?: Questions.Applications.StateApplicationId;
}

model SF424StateReview {
  /** One selection is required. */
  @UI.widget(Rendering.Widget.Radio)
  status: SF424StateReviewStatus;

  /** If 'a' is selected, enter the date the application was submitted to the State. */
  @Validation.requiredWhen(
    SF424StateReview.status,
    SF424StateReviewStatus.Available
  )
  @UI.enabledWhen(SF424StateReview.status, SF424StateReviewStatus.Available)
  date?: plainDate;
}

// =============================================================================
// APPLICANT
// =============================================================================

model SF424Applicant {
  organization: SF424ApplicantOrganization;
  type: SF424ApplicantType;

  /** Enter the Congressional District in the format: 2 character state Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district.If outside the US, enter 00-000. */
  congressionalDistrict: Questions.Types.CongressionalDistrictCode;

  delinquentFederalDebt: SF424DelinquentFederalDebt;
}

model SF424ApplicantOrganization {
  /** Enter the legal name of the applicant that will undertake the assistance activity. This is the organization that has registered with the System for Award Management (SAM). Information on registering with SAM may be obtained by visiting SAM.gov. */
  name: Questions.Organizations.OrgName;

  /** Enter either TIN or EIN as assigned by the Internal Revenue Service.  If your organization is not in the US, enter 44-4444444. */
  ein: Questions.Organizations.OrgEin;

  /** UEI of the applicant organization. This field is pre-populated from the Application cover sheet. */
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.uei)
  uei: Questions.Organizations.OrgUei;

  /** Enter information about the applicant. */
  address: Questions.Types.AddressZipPlusFour;

  // The XSD uses the 30-character `globLib:DepartmentNameDataType`.
  /** Enter the name of primary organizational department, service, laboratory, or equivalent level within the organization which will undertake the assistance activity. */
  @maxLength(30)
  department?: Questions.Organizations.OrgDepartment;

  // The XSD uses the 30-character `globLib:DivisionNameDataType`.
  /** Enter the name of primary organizational division, office, or major subdivision which will undertake the assistance activity. */
  @maxLength(30)
  division?: Questions.Organizations.OrgDivision;
}

model SF424ApplicantType {
  /** Select the appropriate applicant types. */
  @UI.widget(Rendering.Widget.MultiSelect)
  @minItems(1)
  @maxItems(3)
  @JsonSchema.uniqueItems
  codes: Questions.Organizations.ApplicantType[];

  /** Enter the applicant type here if you selected "Other (specify)" for Type of applicant. */
  @Validation.requiredWhen(
    SF424ApplicantType.codes,
    Questions.Organizations.ApplicantType.X
  )
  @minLength(0)
  @maxLength(30)
  otherSpecify?: string;
}

model SF424DelinquentFederalDebt {
  /** If 'Yes,' provide explanation in attachment. */
  answer: Questions.Types.YesNo;

  @Validation.requiredWhen(SF424DelinquentFederalDebt.answer, true)
  @UI.enabledWhen(SF424DelinquentFederalDebt.answer, true)
  explanation?: Questions.Types.Attachment;
}

// =============================================================================
// PROJECT
// =============================================================================

model SF424Project {
  /** Enter a brief, descriptive title of the project. */
  title: Questions.Projects.ProjectTitle;

  /** Attach file(s) using the appropriate buttons. */
  @UI.widget(Rendering.Widget.AttachmentArray)
  @maxItems(100)
  additionalTitles?: Questions.Types.Attachment[];

  /** List the areas or entities using the categories (e.g., cities, counties, states, etc.) specified in agency instructions. */
  areasAffected?: Questions.Types.Attachment;

  /** Enter the Congressional District in the format: 2 character state Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district.If all districts in a state are affected, enter "all" for the district number. Example: MD-all for all congressional districts in Maryland.If nationwide (all districts in all states), enter US-all.If the program/project is outside the US, enter 00-000. */
  congressionalDistrict: Questions.Types.CongressionalDistrictCode;

  /** Attach an additional list of Program/Project Congressional Districts if needed. */
  additionalCongressionalDistricts?: Questions.Types.Attachment;

  timeline: SF424ProjectTimeline;
}

model SF424ProjectTimeline {
  /** Enter the date in the format MM/DD/YYYY. */
  startDate: Questions.Projects.ProjectStartDate;

  /** Enter the date in the format MM/DD/YYYY. */
  @Validation.notBefore(SF424ProjectTimeline.startDate)
  endDate: Questions.Projects.ProjectEndDate;
}

// =============================================================================
// CONTACTS
// =============================================================================

model SF424Contacts {
  pointOfContact: SF424PointOfContact;
  authorizedRepresentative: SF424AuthorizedRepresentative;
}

// Item 8f: the person to contact on matters involving this application.
model SF424PointOfContact {
  /** Enter information about the contact person. */
  name: Questions.People.PersonName;

  /** Enter the position title. */
  title?: Questions.People.PersonTitle;

  organization?: SF424ContactOrganization;

  /** Enter the daytime Telephone Number. */
  phone: Questions.People.PersonPhoneNumber;

  /** Enter the fax Number. */
  fax?: Questions.People.PersonFaxNumber;

  /** Enter a valid email Address. */
  email: Questions.People.PersonEmail;
}

model SF424ContactOrganization {
  /** Enter the organization if different from the applicant organization. */
  name?: Questions.People.PersonOrganizationalAffiliation;
}

// Item 21: the person who signs on the applicant's behalf. The certification holds the
// signature and date.
model SF424AuthorizedRepresentative {
  name: Questions.People.PersonName;

  /** Enter the position title. */
  title: Questions.People.PersonTitle;

  /** Enter the daytime Telephone Number. */
  phone: Questions.People.PersonPhoneNumber;

  /** Enter the fax Number. */
  fax?: Questions.People.PersonFaxNumber;

  /** Enter a valid email Address. */
  email: Questions.People.PersonEmail;
}

// =============================================================================
// BUDGET
// =============================================================================

model SF424Budget {
  fundingSources: SF424FundingSources;
}

// Item 18: estimated funding by source. Grants.gov adds up the six amounts into the total.
model SF424FundingSources {
  /** Enter the dollar amount. */
  federal: Questions.Types.BudgetAmount;

  /** Enter the dollar amount. */
  applicant: Questions.Types.BudgetAmount;

  /** Enter the dollar amount. */
  state: Questions.Types.BudgetAmount;

  /** Enter the dollar amount. */
  local: Questions.Types.BudgetAmount;

  /** Enter the dollar amount. */
  other: Questions.Types.BudgetAmount;

  /** Enter the dollar amount. */
  programIncome: Questions.Types.BudgetAmount;

  /** This field is automatically calculated by Grants.gov */
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Formula.sum(
    SF424FundingSources.federal,
    SF424FundingSources.applicant,
    SF424FundingSources.state,
    SF424FundingSources.local,
    SF424FundingSources.other,
    SF424FundingSources.programIncome
  )
  total?: Questions.Types.BudgetTotalAmount;
}
