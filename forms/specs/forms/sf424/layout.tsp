import "simpler-forms";
import "./form.tsp";

using SimplerForms;
namespace Forms.SF424Regular;

@UI.layout(SF424)
model SF424Layout {
  @UI.label("Application Information")
  @UI.field(SF424.application)
  application: {
    submissionType: RegularApplication.submissionType;
    applicationType: RegularApplication.applicationType;
    revisionType: RegularApplication.revisionType;
    revisionOtherSpecify: RegularApplication.revisionOtherSpecify;
    dateReceived: RegularApplication.dateReceived;
    applicantId: RegularApplication.applicantId;
    federalEntityIdentifier: RegularApplication.federalEntityIdentifier;
    federalAwardIdentifier: RegularApplication.federalAwardIdentifier;
    stateReceiveDate: RegularApplication.stateReceiveDate;
    stateApplicationId: RegularApplication.stateApplicationId;
  };

  @UI.label("Applicant Organization")
  @UI.field(SF424.applicant)
  applicant: {
    legalName: RegularApplicant.legalName;
    ein: RegularApplicant.ein;
    uei: RegularApplicant.uei;
    @UI.flatten address: RegularApplicant.address;
    departmentName: RegularApplicant.departmentName;
    divisionName: RegularApplicant.divisionName;
  };

  @UI.label("Contact Person")
  @UI.field(SF424.contact)
  contact: {
    @UI.flatten name: RegularContact.name;
    title: RegularContact.title;
    organizationalAffiliation: RegularContact.organizationalAffiliation;
    phone: RegularContact.phone;
    fax: RegularContact.fax;
    email: RegularContact.email;
  };

  @UI.label("Applicant Type")
  @UI.field(SF424.applicantType)
  applicantType: {
    codes: RegularApplicantType.codes;
    otherExplanation: RegularApplicantType.otherExplanation;
  };

  @UI.label("Opportunity Information")
  @UI.field(SF424.opportunity)
  opportunity: {
    agencyName: RegularOpportunity.agencyName;
    assistanceListingNumber: RegularOpportunity.assistanceListingNumber;
    assistanceListingTitle: RegularOpportunity.assistanceListingTitle;
    number: RegularOpportunity.number;
    title: RegularOpportunity.title;
    competitionNumber: RegularOpportunity.competitionNumber;
    competitionTitle: RegularOpportunity.competitionTitle;
  };

  @UI.label("Project Information")
  @UI.field(SF424.project)
  project: {
    areasAffected: RegularProject.areasAffected;
    title: RegularProject.title;
    additionalProjectTitle: RegularProject.additionalProjectTitle;
    congressionalDistrictApplicant: RegularProject.congressionalDistrictApplicant;
    congressionalDistrictProgramProject: RegularProject.congressionalDistrictProgramProject;
    additionalCongressionalDistricts: RegularProject.additionalCongressionalDistricts;
    startDate: RegularProject.startDate;
    endDate: RegularProject.endDate;
  };

  @UI.label("Estimated Funding")
  @UI.field(SF424.funding)
  funding: {
    federal: RegularFunding.federal;
    applicant: RegularFunding.applicant;
    state: RegularFunding.state;
    local: RegularFunding.local;
    other: RegularFunding.other;
    programIncome: RegularFunding.programIncome;
    total: RegularFunding.total;
  };

  @UI.label("State Review")
  @UI.field(SF424.stateReview)
  stateReview: {
    status: RegularStateReview.status;
    availableDate: RegularStateReview.availableDate;
  };

  @UI.label("Federal Debt")
  @UI.field(SF424.debt)
  debt: {
    isDelinquent: RegularDebt.isDelinquent;
    explanation: RegularDebt.explanation;
  };

  @UI.label("Certification")
  @doc("21. *By signing this application, I certify (1) to the statements contained in the list of certifications** and (2) that the statements herein are true, complete and accurate to the best of my knowledge. I also provide the required assurances** and agree to comply with any resulting terms if I accept an award. I am aware that any false, fictitious, or fraudulent statements or claims may subject me to criminal, civil, or administrative penalties. (U.S. Code, Title 18, Section 1001)\n\n** The list of certifications and assurances, or an internet site where you may obtain this list, is contained in the announcement or agency specific instructions.")
  @UI.field(SF424.certification)
  certification: {
    agree: RegularCertification.agree;
  };

  @UI.label("Authorized Representative")
  @UI.field(SF424.authorizedRepresentative)
  authorizedRepresentative: {
    @UI.flatten name: RegularRepresentative.name;
    title: RegularRepresentative.title;
    phone: RegularRepresentative.phone;
    email: RegularRepresentative.email;
    fax: RegularRepresentative.fax;
    signature: RegularRepresentative.signature;
    dateSigned: RegularRepresentative.dateSigned;
  };
}
