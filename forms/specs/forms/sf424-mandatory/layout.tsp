import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.SF424Mandatory;

@UI.layout(SF424Mandatory)
model MandatoryLayout {
  @UI.label("Submission Information")
  @UI.field(SF424Mandatory.submission)
  submission: {
    type: MandatorySubmission.type;
    typeOtherDescription: MandatorySubmission.typeOtherDescription;
    frequency: MandatorySubmission.frequency;
    frequencyOtherDescription: MandatorySubmission.frequencyOtherDescription;
    consolidatedRequest: MandatorySubmission.consolidatedRequest;
    consolidatedRequestExplanation: MandatorySubmission.consolidatedRequestExplanation;
    version: MandatorySubmission.version;
  };

  @UI.label("Dates")
  @UI.field(SF424Mandatory.dates)
  dates: {
    receivedDate: MandatoryDates.receivedDate;
    stateReceivedDate: MandatoryDates.stateReceivedDate;
  };

  @UI.label("Identifiers")
  @UI.field(SF424Mandatory.identifiers)
  identifiers: {
    applicantId: MandatoryIdentifiers.applicantId;
    federalEntityId: MandatoryIdentifiers.federalEntityId;
    federalAwardId: MandatoryIdentifiers.federalAwardId;
    stateApplicationId: MandatoryIdentifiers.stateApplicationId;
  };

  @UI.label("Applicant Organization")
  @UI.field(SF424Mandatory.applicant)
  applicant: {
    legalName: MandatoryApplicant.legalName;
    ein: MandatoryApplicant.ein;
    uei: MandatoryApplicant.uei;
    @UI.flatten address: MandatoryApplicant.address;
    department: MandatoryApplicant.department;
    division: MandatoryApplicant.division;
    @UI.flatten type: MandatoryApplicant.type;
  };

  @UI.label("Contact Person")
  @UI.field(SF424Mandatory.contact)
  contact: {
    @UI.flatten name: MandatoryContact.name;
    title: MandatoryContact.title;
    organizationalAffiliation: MandatoryContact.organizationalAffiliation;
    phone: MandatoryContact.phone;
    fax: MandatoryContact.fax;
    email: MandatoryContact.email;
  };

  @UI.label("Agency and Program Information")
  @UI.field(SF424Mandatory.opportunity)
  opportunity: {
    agencyName: MandatoryOpportunity.agencyName;
    @UI.flatten assistanceListing: MandatoryOpportunity.assistanceListing;
  };

  @UI.label("Project Information")
  @UI.field(SF424Mandatory.project)
  project: {
    title: MandatoryProject.title;
    areasAffected: MandatoryProject.areasAffected;
  };

  @UI.label("Congressional Districts")
  @UI.field(SF424Mandatory.congressionalDistricts)
  congressionalDistricts: {
    applicant: MandatoryCongressionalDistricts.applicant;
    project: MandatoryCongressionalDistricts.project;
    additionalAttachment: MandatoryCongressionalDistricts.additionalAttachment;
  };

  @UI.label("Funding Period and Estimated Funding")
  @UI.field(SF424Mandatory.funding)
  funding: {
    startDate: MandatoryFunding.startDate;
    endDate: MandatoryFunding.endDate;
    estimatedFederal: MandatoryFunding.estimatedFederal;
    estimatedMatch: MandatoryFunding.estimatedMatch;
  };

  @UI.label("State Review")
  @UI.field(SF424Mandatory.stateReview)
  stateReview: {
    status: MandatoryStateReview.status;
    availableDate: MandatoryStateReview.availableDate;
  };

  @UI.label("Federal Debt")
  @UI.field(SF424Mandatory.debt)
  debt: {
    isDelinquent: MandatoryDebt.isDelinquent;
    explanation: MandatoryDebt.explanation;
  };

  @doc("18. By signing this application, I certify (1) to the statements contained in the list of certifications** and (2) that the statements herein are true, complete and accurate to the best of my knowledge. I also provide the required assurances** and agree to comply with any resulting terms if I accept an award. I am aware that any false, fictitious, or fraudulent statements or claims may subject me to criminal, civil, or administrative penalties. (U.S. Code, Title 18, Section 1001)\n\n** This list of certifications and assurances, or an internet site where you may obtain this list, is contained in the announcement or agency specific instructions.")
  @UI.label("Certification")
  @UI.field(SF424Mandatory.certification)
  certification: {
    agree: MandatoryCertification.agree;
  };

  @UI.label("Authorized Representative")
  @UI.field(SF424Mandatory.authorizedRepresentative)
  authorizedRepresentative: {
    @UI.flatten name: MandatoryAuthorizedRepresentative.name;
    title: MandatoryAuthorizedRepresentative.title;
    organizationalAffiliation: MandatoryAuthorizedRepresentative.organizationalAffiliation;
    phone: MandatoryAuthorizedRepresentative.phone;
    fax: MandatoryAuthorizedRepresentative.fax;
    email: MandatoryAuthorizedRepresentative.email;
    signature: MandatoryAuthorizedRepresentative.signature;
    dateSigned: MandatoryAuthorizedRepresentative.dateSigned;
  };

  @UI.label("Attachments")
  attachments: {
    attachments: SF424Mandatory.attachments;
  };
}
