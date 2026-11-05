import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "#questions/certification/index.tsp";
import "#questions/opportunity/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/organization/applicant-type.tsp";
import "#questions/person/index.tsp";
import "#questions/project/index.tsp";
import "#questions/types/attachment.tsp";
import "./examples.tsp";

using SimplerForms;
namespace Forms.SF424Research;

@Meta.form(#{
  id: "sf424-r-r",
  formName: "Application for Federal Assistance (SF 424 R&R)",
})
@GrantsGov.form(#{
  legacyFormId: 768,
  shortFormName: "RR_SF424_5_0",
  formVersion: "5.0",
  agencyCode: "GOV",
  ombNumber: "4040-0001",
  expirationDate: "2029-01-31",
})
@example(Examples.revision)
@example(Examples.newApplication)
model ResearchCover {
  application: Application;
  applicantOrganization: ApplicantOrganization;
  applicantContact: Questions.People.Person;
  applicantType: CoverApplicantType;
  opportunity: CoverOpportunity;
  project: CoverProject;

  @Validation.requiredPaths("email")
  principalInvestigator: ResearchContact;

  funding: Funding;

  @Validation.requiredPathWhen("date", "status", StateReviewStatus.Yes)
  stateReview: StateReview;

  certification: CoverCertification;

  @Validation.requiredPaths("title", "email")
  authorizedRepresentative: ResearchContact;

  attachments: Attachments;
}

enum SubmissionType {
  Preapplication: "Preapplication",
  Application: "Application",
  Corrected: "Change/Corrected Application",
}

enum ApplicationType {
  New: "New",
  Resubmission: "Resubmission",
  Renewal: "Renewal",
  Continuation: "Continuation",
  Revision: "Revision",
}

enum RevisionCode {
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

model Application {
  @UI.label("Type of Submission")
  @UI.widget(Rendering.Widget.Radio)
  submissionType: SubmissionType;

  @UI.label("Date Submitted")
  submittedDate?: plainDate;

  @UI.label("Applicant Identifier")
  @minLength(1)
  @maxLength(30)
  applicantId?: string;

  @UI.label("Date Received by State")
  stateReceivedDate?: plainDate;

  @UI.label("State Application Identifier")
  @minLength(1)
  @maxLength(30)
  stateId?: string;

  @UI.label("Federal Identifier")
  @doc("For a renewal, continuation, or revision, enter the assigned federal identifier, even if this submission is a correction.")
  @Validation.requiredWhen(Application.applicationType, ApplicationType.Renewal)
  @Validation.requiredWhen(
    Application.applicationType,
    ApplicationType.Continuation
  )
  @Validation.requiredWhen(
    Application.applicationType,
    ApplicationType.Revision
  )
  @minLength(1)
  @maxLength(30)
  federalId?: string;

  @UI.label("Agency Routing Identifier")
  @minLength(1)
  @maxLength(75)
  agencyRoutingNumber?: string;

  @UI.label("Previous Grants.gov Tracking ID")
  @doc("If you are changing or correcting a previously submitted application, enter its Grants.gov tracking ID.")
  @Validation.requiredWhen(Application.submissionType, SubmissionType.Corrected)
  @minLength(13)
  @maxLength(15)
  trackingId?: string;

  @UI.label("Type of Application")
  @UI.widget(Rendering.Widget.Radio)
  applicationType: ApplicationType;

  @UI.label("Revision Type")
  @doc("A increases the award, B decreases the award, C increases the duration, and D decreases the duration. Choose AC, AD, BC, or BD if both change. Choose E for Other.")
  @UI.widget(Rendering.Widget.Select)
  @UI.enabledWhen(Application.applicationType, ApplicationType.Revision)
  revisionCode?: RevisionCode;

  @UI.label("Other Revision Explanation")
  @UI.enabledWhen(Application.revisionCode, RevisionCode.E)
  @Validation.requiredWhen(Application.revisionCode, RevisionCode.E)
  @minLength(1)
  @maxLength(45)
  revisionExplanation?: string;

  @UI.label("Is this application being submitted to other agencies?")
  @UI.widget(Rendering.Widget.Radio)
  submittedToOtherAgencies: boolean;

  @UI.label("Which other agencies?")
  @UI.enabledWhen(Application.submittedToOtherAgencies, true)
  @Validation.requiredWhen(Application.submittedToOtherAgencies, true)
  @minLength(1)
  @maxLength(20)
  otherAgencyExplanation?: string;
}

model ApplicantOrganization {
  @UI.label("Legal Organization Name")
  name: Questions.Organizations.OrgName;

  @UI.label("SAM UEI")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.uei)
  uei: Questions.Organizations.OrgUei;

  department?: Questions.Organizations.OrgDepartment;
  division?: Questions.Organizations.OrgDivision;
  address: Questions.Organizations.OrgAddress;

  @UI.label("Employer Identification Number (EIN/TIN)")
  @minLength(9)
  @maxLength(30)
  employerId: string;
}

alias ApplicantCode = Questions.Organizations.ApplicantType;

model CoverApplicantType {
  @UI.label("Type of Applicant")
  code: ApplicantCode;

  @UI.label("Other Applicant Type")
  @UI.enabledWhen(CoverApplicantType.code, ApplicantCode.X)
  @Validation.requiredWhen(CoverApplicantType.code, ApplicantCode.X)
  @minLength(1)
  @maxLength(50)
  otherExplanation?: string;

  @UI.label("Small Business Organization Type")
  @UI.enabledWhen(CoverApplicantType.code, ApplicantCode.R)
  smallBusiness?: SmallBusiness;
}

model SmallBusiness {
  @UI.label("Women Owned")
  @UI.widget(Rendering.Widget.Radio)
  womenOwned?: boolean;

  @UI.label("Socially and Economically Disadvantaged")
  @UI.widget(Rendering.Widget.Radio)
  sociallyAndEconomicallyDisadvantaged?: boolean;
}

model CoverOpportunity {
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.agencyName)
  agencyName: Questions.Opportunities.AgencyName;

  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.assistanceListingNumber)
  assistanceListingNumber?: Questions.Opportunities.AssistanceListingNumber;

  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.assistanceListingTitle)
  assistanceListingTitle?: Questions.Opportunities.AssistanceListingTitle;
}

model CoverProject {
  title: Questions.Projects.ProjectTitle;
  startDate: Questions.Projects.ProjectStartDate;

  @Validation.notBefore(CoverProject.startDate)
  endDate: Questions.Projects.ProjectEndDate;

  @UI.label("Congressional District of Applicant")
  congressionalDistrict: Questions.People.PersonCongressionalDistrict;
}

model ResearchContact {
  ...Questions.People.Person;

  @UI.label("Organization Name")
  organizationName: Questions.Organizations.OrgName;

  department?: Questions.Organizations.OrgDepartment;
  division?: Questions.Organizations.OrgDivision;
}

// The Grants.gov budget total accepts up to 13 whole digits and two decimal places.
@pattern("^(?:0|[1-9][0-9]{0,12})(?:[.][0-9]{1,2})?$")
scalar FundingAmount extends string;

model Funding {
  @UI.label("Total Federal Funds Requested")
  federal: FundingAmount;

  @UI.label("Total Non-Federal Funds")
  nonFederal: FundingAmount;

  @UI.label("Total Federal and Non-Federal Funds")
  @doc("Enter the total for the entire project period, including both federal and non-federal funds.")
  total: FundingAmount;

  @UI.label("Estimated Program Income")
  programIncome: FundingAmount;
}

enum StateReviewStatus {
  Yes: "Y: Yes",
  NotCovered: "Program is not covered by E.O. 12372",
  NotSelected: "Program has not been selected by state for review",
}

model StateReview {
  @UI.label("Is this application subject to state review under Executive Order 12372?")
  @UI.widget(Rendering.Widget.Radio)
  status: StateReviewStatus;

  @UI.label("Date Submitted for State Review")
  @UI.enabledWhen(StateReview.status, StateReviewStatus.Yes)
  date?: plainDate;
}

model CoverCertification {
  @UI.label("I agree")
  @UI.widget(Rendering.Widget.Checkbox)
  agree: true;

  @UI.label("Signature of Authorized Representative")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.signature)
  signature?: Questions.Certifications.Signature;

  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.currentDate)
  dateSigned?: Questions.Certifications.DateSigned;
}

model Attachments {
  @UI.label("SF-LLL or Other Explanatory Documentation")
  lobbyingDisclosure?: Questions.Types.Attachment;

  @UI.label("Pre-Application")
  preApplication?: Questions.Types.Attachment;

  @UI.label("Cover Letter")
  coverLetter?: Questions.Types.Attachment;
}
