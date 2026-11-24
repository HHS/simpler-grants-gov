import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#questions/application/index.tsp";
import "#questions/opportunity/index.tsp";
import "#questions/organization/applicant-type.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/index.tsp";
import "#questions/project/index.tsp";
import "#questions/types/attachment.tsp";
import "#questions/types/budget.tsp";
import "#questions/types/congressional-district.tsp";
import "#questions/types/yes-no.tsp";

using SimplerForms;

namespace Forms.SF424Research;

// =============================================================================
// OPPORTUNITY
// =============================================================================

// Pre-populate every opportunity field from the funding opportunity.
model ResearchOpportunity {
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.agencyName)
  agencyName: Questions.Opportunities.AgencyName;

  assistanceListing?: Questions.Opportunities.AssistanceListing;
}

// =============================================================================
// APPLICATION
// =============================================================================

model ResearchApplication {
  /** For a changed or corrected application, enter the previous Grants.gov tracking ID below. */
  @UI.label("Type of Submission")
  @UI.widget(Rendering.Widget.Radio)
  submissionType: ResearchSubmissionType;

  // DAT 02-0 lists Date Submitted as an applicant-entered field with no system rule.
  /** Enter the date the application was submitted to the federal agency or state, if applicable. */
  @UI.label("Date Submitted")
  dateSubmitted?: plainDate;

  applicantId?: Questions.Applications.ApplicantId;
  state?: ResearchStateApplication;

  // A prior award's identifier, not SF-424's federal entity identifier.
  /** For a renewal, continuation, or revision, enter the assigned federal identifier, even if this submission is a correction. */
  @Validation.requiredWhen(
    ResearchApplication.applicationType,
    ResearchApplicationType.Renewal
  )
  @Validation.requiredWhen(
    ResearchApplication.applicationType,
    ResearchApplicationType.Continuation
  )
  @Validation.requiredWhen(
    ResearchApplication.applicationType,
    ResearchApplicationType.Revision
  )
  federalIdentifier?: Questions.Applications.FederalId;

  /** Enter the agency routing number if the funding agency’s instructions provide one. */
  @UI.label("Agency Routing Identifier")
  @minLength(1)
  @maxLength(75)
  agencyRoutingNumber?: string;

  /** If you are changing or correcting a previously submitted application, enter its Grants.gov tracking ID. */
  @UI.label("Previous Grants.gov Tracking ID")
  @Validation.requiredWhen(
    ResearchApplication.submissionType,
    ResearchSubmissionType.Corrected
  )
  @minLength(13)
  @maxLength(15)
  previousTrackingId?: string;

  @UI.label("Type of Application")
  @UI.widget(Rendering.Widget.Radio)
  applicationType: ResearchApplicationType;

  revision?: ResearchRevision;
  otherAgencies: ResearchOtherAgencies;

  @Validation.requiredPathWhen("date", "status", ResearchStateReviewStatus.Yes)
  stateReview: ResearchStateReview;
}

// The state fills these in, if it reviews the application.
model ResearchStateApplication {
  /** Enter the date the state received the application, if applicable. */
  receivedDate?: Questions.Applications.StateReceivedDate;

  /** Enter the state application identifier, if applicable. */
  applicationId?: Questions.Applications.StateApplicationId;
}

// The layout enables the revision type only for a revision application, since the
// condition reads a field outside this model.
model ResearchRevision {
  /** A increases the award, B decreases the award, C increases the duration, and D decreases the duration. Choose AC, AD, BC, or BD if both change. Choose E for Other. */
  @UI.label("Revision Type")
  @UI.widget(Rendering.Widget.Select)
  type?: ResearchRevisionCode;

  /** Explain the revision if you selected E, Other. */
  @UI.label("Other Revision Explanation")
  @UI.enabledWhen(ResearchRevision.type, ResearchRevisionCode.E)
  @Validation.requiredWhen(ResearchRevision.type, ResearchRevisionCode.E)
  @minLength(1)
  @maxLength(45)
  otherSpecify?: string;
}

model ResearchOtherAgencies {
  // Blank the bank's generic Yes/No help: the question needs none.
  @UI.label("Is this application being submitted to other agencies?")
  @doc("")
  submitted: Questions.Types.YesNo;

  /** Enter the name of the other agency. */
  @UI.label("Which other agencies?")
  @UI.enabledWhen(ResearchOtherAgencies.submitted, true)
  @Validation.requiredWhen(ResearchOtherAgencies.submitted, true)
  @minLength(1)
  @maxLength(20)
  explanation?: string;
}

model ResearchStateReview {
  /** If the announcement says the program is covered by Executive Order 12372, contact your State Single Point of Contact. */
  @UI.label("Is this application subject to state review under Executive Order 12372?")
  @UI.widget(Rendering.Widget.Radio)
  status: ResearchStateReviewStatus;

  /** Enter the date you submitted the application to the state for review. */
  @UI.label("Date Submitted for State Review")
  @UI.enabledWhen(ResearchStateReview.status, ResearchStateReviewStatus.Yes)
  date?: plainDate;
}

// =============================================================================
// APPLICANT
// =============================================================================

model ResearchApplicant {
  organization: ResearchOrganization;
  type: ResearchApplicantType;

  /** Enter the Congressional District as a two-character state abbreviation, a hyphen and a three-digit district number (for example, CA-005). If outside the US, enter 00-000. */
  @UI.label("Congressional District of Applicant")
  congressionalDistrict: Questions.Types.CongressionalDistrictCode;
}

// `globLib:OrganizationDataTypeV5`, plus the root `EmployerID`. Department and division use
// the 100-character V2 types, as the bank questions do.
model ResearchOrganization {
  @UI.label("Legal Organization Name")
  name: Questions.Organizations.OrgName;

  @UI.label("SAM UEI")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.uei)
  uei: Questions.Organizations.OrgUei;

  /** Enter your IRS-assigned EIN or TIN. For a non-US organization, enter 44-4444444. */
  @UI.label("Employer Identification Number (EIN/TIN)")
  ein: Questions.Organizations.OrgEin;

  address: Questions.Types.AddressZipPlusFour;
  department?: Questions.Organizations.OrgDepartment;
  division?: Questions.Organizations.OrgDivision;
}

model ResearchApplicantType {
  @UI.label("Type of Applicant")
  code: Questions.Organizations.ApplicantType;

  @UI.label("Other Applicant Type")
  @UI.enabledWhen(
    ResearchApplicantType.code,
    Questions.Organizations.ApplicantType.X
  )
  @Validation.requiredWhen(
    ResearchApplicantType.code,
    Questions.Organizations.ApplicantType.X
  )
  @minLength(1)
  @maxLength(50)
  otherSpecify?: string;

  @UI.label("Small Business Organization Type")
  @UI.enabledWhen(
    ResearchApplicantType.code,
    Questions.Organizations.ApplicantType.R
  )
  smallBusiness?: ResearchSmallBusiness;
}

model ResearchSmallBusiness {
  /** Select Yes if women own at least 51% of the business and control and operate it. */
  @UI.label("Women Owned")
  womenOwned?: Questions.Types.YesNo;

  /** Select Yes if the U.S. Small Business Administration has determined that the business qualifies under section 8(a) of the Small Business Act. */
  @UI.label("Socially and Economically Disadvantaged")
  sociallyDisadvantaged?: Questions.Types.YesNo;
}

// =============================================================================
// PROJECT
// =============================================================================

model ResearchProject {
  title: Questions.Projects.ProjectTitle;
  timeline: ResearchTimeline;
}

model ResearchTimeline {
  startDate: Questions.Projects.ProjectStartDate;

  @Validation.notBefore(ResearchTimeline.startDate)
  endDate: Questions.Projects.ProjectEndDate;
}

// =============================================================================
// CONTACTS
// =============================================================================

model ResearchContacts {
  @Validation.requiredPaths("title", "email")
  authorizedRepresentative: ResearchContact;

  @Validation.requiredPaths("email")
  projectDirector: ResearchContact;

  pointOfContact: ResearchContactPerson;
}

// The applicant's contact person: `ContactPersonInfo`, a `globLib:ContactPersonDataTypeV3`.
model ResearchContactPerson {
  /** Enter the person's name. First and last name are required. */
  @UI.label("Name")
  name: Questions.People.PersonName;

  /** Enter the position title. */
  @UI.label("Title")
  title?: Questions.People.PersonTitle;

  /** Enter the person's complete address. */
  @UI.label("Address")
  address: Questions.Types.AddressZipPlusFour;

  /** Enter the phone number. */
  @UI.label("Phone Number")
  phone: Questions.People.PersonPhoneNumber;

  /** Enter the fax number. */
  @UI.label("Fax Number")
  fax?: Questions.People.PersonFaxNumber;

  /** Enter the email address. */
  @UI.label("Email")
  email?: Questions.People.PersonEmail;
}

// A contact person with their organization: the PD/PI's `OrganizationContactPersonDataType`
// and the AOR's `AORInfoType`. Each role requires its own extra fields in `ResearchContacts`.
model ResearchContact {
  ...PickProperties<ResearchContactPerson, "name" | "title">;
  organization: ResearchPersonOrganization;
  ...OmitProperties<ResearchContactPerson, "name" | "title">;
}

model ResearchPersonOrganization {
  /** Enter the legal name of the organization. */
  @UI.label("Organization Name")
  name: Questions.People.PersonOrganizationalAffiliation;

  department?: Questions.Organizations.OrgDepartment;
  division?: Questions.Organizations.OrgDivision;
}

// =============================================================================
// BUDGET
// =============================================================================

model ResearchBudget {
  fundingSources: ResearchFundingSources;
}

// DAT 15-1 to 15-4 are applicant-entered, line 15c included: no business rule totals it.
model ResearchFundingSources {
  @UI.label("Total Federal Funds Requested")
  federal: Questions.Types.BudgetTotalAmount;

  @UI.label("Total Non-Federal Funds")
  nonFederal: Questions.Types.BudgetTotalAmount;

  /** Enter the total for the entire project period, including both federal and non-federal funds. */
  @UI.label("Total Federal and Non-Federal Funds")
  total: Questions.Types.BudgetTotalAmount;

  /** Enter estimated program income for the entire project period. */
  @UI.label("Estimated Program Income")
  programIncome: Questions.Types.BudgetTotalAmount;
}

// =============================================================================
// ATTACHMENTS
// =============================================================================

model ResearchAttachments {
  @UI.label("Cover Letter")
  coverLetter?: Questions.Types.Attachment;

  @UI.label("Pre-Application")
  preApplication?: Questions.Types.Attachment;

  @UI.label("SF-LLL or Other Explanatory Documentation")
  lobbyingDisclosure?: Questions.Types.Attachment;
}

// =============================================================================
// ANSWER TYPES
// =============================================================================

enum ResearchSubmissionType {
  Preapplication: "Preapplication",
  Application: "Application",
  Corrected: "Change/Corrected Application",
}

enum ResearchApplicationType {
  New: "New",
  Resubmission: "Resubmission",
  Renewal: "Renewal",
  Continuation: "Continuation",
  Revision: "Revision",
}

enum ResearchRevisionCode {
  A,
  B,
  C,
  D,
  E,
  AC,
  AD,
  BC,
  BD,
}

enum ResearchStateReviewStatus {
  Yes: "Y: Yes",
  NotCovered: "Program is not covered by E.O. 12372",
  NotSelected: "Program has not been selected by state for review",
}
