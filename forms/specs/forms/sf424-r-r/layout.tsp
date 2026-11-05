import "simpler-forms";
import "./form.tsp";

using SimplerForms;
namespace Forms.SF424Research;
alias Person = Questions.People.Person;

@UI.layout(ResearchCover)
model ResearchCoverLayout {
  @UI.label("Submission and Application")
  @UI.field(ResearchCover.application)
  application: {
    submissionType: Application.submissionType;
    submittedDate: Application.submittedDate;
    applicantId: Application.applicantId;
    stateReceivedDate: Application.stateReceivedDate;
    stateId: Application.stateId;
    federalId: Application.federalId;
    agencyRoutingNumber: Application.agencyRoutingNumber;
    trackingId: Application.trackingId;
    applicationType: Application.applicationType;
    revisionCode: Application.revisionCode;
    revisionExplanation: Application.revisionExplanation;
    submittedToOtherAgencies: Application.submittedToOtherAgencies;
    otherAgencyExplanation: Application.otherAgencyExplanation;
  };

  @UI.label("Applicant Organization")
  @UI.field(ResearchCover.applicantOrganization)
  applicantOrganization: {
    name: ApplicantOrganization.name;
    uei: ApplicantOrganization.uei;
    department: ApplicantOrganization.department;
    division: ApplicantOrganization.division;
    @UI.flatten address: ApplicantOrganization.address;
    employerId: ApplicantOrganization.employerId;
  };

  @UI.label("Applicant Contact")
  @UI.field(ResearchCover.applicantContact)
  applicantContact: {
    @UI.flatten name: Person.name;
    title: Person.title;
    @UI.flatten address: Person.address;
    phone: Person.phone;
    fax: Person.fax;
    email: Person.email;
  };

  @UI.label("Type of Applicant")
  @UI.field(ResearchCover.applicantType)
  applicantType: {
    code: CoverApplicantType.code;
    otherExplanation: CoverApplicantType.otherExplanation;
    smallBusiness: CoverApplicantType.smallBusiness;
  };

  @UI.label("Opportunity")
  @UI.field(ResearchCover.opportunity)
  opportunity: {
    agencyName: CoverOpportunity.agencyName;
    assistanceListingNumber: CoverOpportunity.assistanceListingNumber;
    assistanceListingTitle: CoverOpportunity.assistanceListingTitle;
  };

  @UI.label("Proposed Project")
  @UI.field(ResearchCover.project)
  project: {
    title: CoverProject.title;
    startDate: CoverProject.startDate;
    endDate: CoverProject.endDate;
    congressionalDistrict: CoverProject.congressionalDistrict;
  };

  @UI.label("Project Director / Principal Investigator")
  @UI.field(ResearchCover.principalInvestigator)
  principalInvestigator: {
    @UI.flatten name: ResearchContact.name;
    title: ResearchContact.title;
    organizationName: ResearchContact.organizationName;
    department: ResearchContact.department;
    division: ResearchContact.division;
    @UI.flatten address: ResearchContact.address;
    phone: ResearchContact.phone;
    fax: ResearchContact.fax;
    email: ResearchContact.email;
  };

  @UI.label("Estimated Project Funding")
  @UI.field(ResearchCover.funding)
  funding: {
    federal: Funding.federal;
    nonFederal: Funding.nonFederal;
    total: Funding.total;
    programIncome: Funding.programIncome;
  };

  @UI.label("State Review")
  @UI.field(ResearchCover.stateReview)
  stateReview: {
    status: StateReview.status;
    date: StateReview.date;
  };

  @UI.label("Certification")
  @doc("By signing this application, I certify (1) to the statements contained in the list of certifications* and (2) that the statements herein are true, complete and accurate to the best of my knowledge. I also provide the required assurances* and agree to comply with any resulting terms if I accept an award. I am aware that any false, fictitious, or fraudulent statements or claims may subject me to criminal, civil, or administrative penalties. (U.S. Code, Title 18, Section 1001)\n\n* The list of certifications and assurances, or an internet site where you may obtain this list, is contained in the announcement or agency specific instructions.")
  @UI.field(ResearchCover.certification)
  certification: {
    agree: CoverCertification.agree;
    signature: CoverCertification.signature;
    dateSigned: CoverCertification.dateSigned;
  };

  @UI.label("Authorized Organization Representative")
  @UI.field(ResearchCover.authorizedRepresentative)
  authorizedRepresentative: {
    @UI.flatten name: ResearchContact.name;
    title: ResearchContact.title;
    organizationName: ResearchContact.organizationName;
    department: ResearchContact.department;
    division: ResearchContact.division;
    @UI.flatten address: ResearchContact.address;
    phone: ResearchContact.phone;
    fax: ResearchContact.fax;
    email: ResearchContact.email;
  };

  @UI.label("Supporting Files")
  @UI.field(ResearchCover.attachments)
  attachments: {
    lobbyingDisclosure: Attachments.lobbyingDisclosure;
    preApplication: Attachments.preApplication;
    coverLetter: Attachments.coverLetter;
  };
}
