import "simpler-forms";

import "#questions/certification/index.tsp";

import "./form.tsp";

using SimplerForms;

namespace Forms.SF424Short;

// The Grants.gov form's sections, in its item order. The data nests by concept instead, so
// the applicant's organization and type share one section, and the signature shows with the
// authorized representative.
@UI.layout(SF424Short)
model SF424ShortLayout {
  @UI.label("Opportunity information")
  @UI.field(SF424Short.opportunity)
  opportunity: {
    agencyName: ShortOpportunity.agencyName;
    @UI.flatten assistanceListing: ShortOpportunity.assistanceListing;
    number: ShortOpportunity.number;
    title: ShortOpportunity.title;
  };

  @UI.label("Application information")
  @UI.field(SF424Short.application)
  application: {
    dateReceived: ShortApplication.dateReceived;
  };

  @UI.label("Applicant organization")
  @UI.field(SF424Short.applicant)
  applicant: {
    @UI.label("Legal Name") name: ShortApplicant.organization::type.name;

    @UI.label("Applicant address")
    address: ShortApplicant.organization::type.address;

    webAddress: ShortApplicant.organization::type.webAddress;
    @UI.label("Type of Applicant") codes: ShortApplicant.type::type.codes;
    otherSpecify: ShortApplicant.type::type.otherSpecify;
    ein: ShortApplicant.organization::type.ein;
    @UI.label("UEI") uei: ShortApplicant.organization::type.uei;

    @UI.label("Congressional District of Applicant")
    congressionalDistrict: ShortApplicant.congressionalDistrict;
  };

  @UI.label("Project information")
  @UI.field(SF424Short.project)
  project: {
    title: ShortProject.title;
    description: ShortProject.description;
    @UI.flatten timeline: ShortProject.timeline;
  };

  // Place the whole contacts field here, so the sections below can take its other roles.
  @UI.label("Project Director")
  @UI.field(SF424Short.contacts)
  contacts: {
    @UI.flatten projectDirector: ShortContacts.projectDirector;
  };

  @UI.label("Primary Contact / Grants Administrator")
  contact: {
    @UI.flatten pointOfContact: SF424Short.contacts::type.pointOfContact;
  };

  /**
   * 9. * By signing this application, I certify (1) to the statements contained in the list of certifications** and (2) that the statements herein are true, complete and accurate to the best of my knowledge.  I also provide the required assurances** and agree to comply with any resulting terms if I accept an award.  I am aware that any false, fictitious, or fradulent statements or claims may subject me to criminal, civil, or administrative penalties (U.S. Code, Title 18, Section 1001)
   *
   * ** The list of certifications and assurances, or an internet site where you may obtain this list, is contained in the announcement or agency specific instructions.
   */
  @UI.label("Certification")
  @UI.field(SF424Short.certification)
  certification: {
    agree: Questions.Certifications.Certification.agree;
  };

  @UI.label("Authorized Representative")
  @UI.field(SF424Short.contacts::type.authorizedRepresentative)
  authorizedRepresentative: {
    @UI.flatten name: ShortRepresentative.name;
    title: ShortRepresentative.title;
    email: ShortRepresentative.email;
    phone: ShortRepresentative.phone;
    fax: ShortRepresentative.fax;
    signature: SF424Short.certification::type.signature;
    dateSigned: SF424Short.certification::type.dateSigned;
  };
}
