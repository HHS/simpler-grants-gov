import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.SF424Short;

@UI.layout(SF424Short)
model SF424ShortLayout {
  @UI.label("Opportunity information")
  @UI.field(SF424Short.opportunity)
  opportunity: {
    agencyName: ShortOpportunity.agencyName;
    assistanceListingNumber: ShortOpportunity.assistanceListingNumber;
    assistanceListingProgramTitle: ShortOpportunity.assistanceListingProgramTitle;
    fundingOpportunityNumber: ShortOpportunity.fundingOpportunityNumber;
    fundingOpportunityTitle: ShortOpportunity.fundingOpportunityTitle;
  };

  @UI.label("Application information")
  application: {
    dateReceived: SF424Short.dateReceived;
  };

  @UI.label("Applicant organization")
  @UI.field(SF424Short.applicant)
  applicant: {
    organizationName: ShortApplicant.organizationName;
    address: ShortApplicant.address;
    applicantWebAddress: ShortApplicant.applicantWebAddress;
    applicantTypeCode: ShortApplicant.applicantTypeCode;
    applicantTypeOtherSpecify: ShortApplicant.applicantTypeOtherSpecify;
    employerTaxpayerIdentificationNumber: ShortApplicant.employerTaxpayerIdentificationNumber;
    samUei: ShortApplicant.samUei;
    congressionalDistrictApplicant: ShortApplicant.congressionalDistrictApplicant;
  };

  @UI.label("Project information")
  @UI.field(SF424Short.project)
  project: {
    title: ShortProject.title;
    description: ShortProject.description;
    startDate: ShortProject.startDate;
    endDate: ShortProject.endDate;
  };

  @UI.label("Project Director")
  director: {
    @UI.flatten
    projectDirector: SF424Short.projectDirector;
  };

  @UI.label("Primary Contact / Grants Administrator")
  contact: {
    sameAsProjectDirector: SF424Short.sameAsProjectDirector;

    @UI.flatten
    contactPerson: SF424Short.contactPerson;
  };

  @UI.label("Certification")
  @doc("9. * By signing this application, I certify (1) to the statements contained in the list of certifications** and (2) that the statements herein are true, complete and accurate to the best of my knowledge.  I also provide the required assurances** and agree to comply with any resulting terms if I accept an award.  I am aware that any false, fictitious, or fradulent statements or claims may subject me to criminal, civil, or administrative penalties (U.S. Code, Title 18, Section 1001)\n\n** The list of certifications and assurances, or an internet site where you may obtain this list, is contained in the announcement or agency specific instructions.")
  certification: {
    applicationCertification: SF424Short.applicationCertification;
  };

  @UI.label("Authorized Representative")
  @UI.field(SF424Short.authorizedRepresentative)
  authorizedRepresentative: {
    @UI.flatten
    name: ShortRepresentative.name;

    title: ShortRepresentative.title;
    email: ShortRepresentative.email;
    phone: ShortRepresentative.phone;
    fax: ShortRepresentative.fax;
    signature: ShortRepresentative.signature;
    dateSigned: ShortRepresentative.dateSigned;
  };
}
