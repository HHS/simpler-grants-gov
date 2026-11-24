import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.SF424Research;

// The sections the preview had before the shared SF-424 structure, in the same order. Each
// section that shows part of a nested group names it with `::type`, from the form root.
@UI.layout(ResearchCover)
model ResearchCoverLayout {
  @UI.label("Submission and Application")
  @UI.field(ResearchCover.application)
  application: {
    submissionType: ResearchApplication.submissionType;
    dateSubmitted: ResearchApplication.dateSubmitted;
    applicantId: ResearchApplication.applicantId;
    @UI.flatten state: ResearchApplication.state;
    federalIdentifier: ResearchApplication.federalIdentifier;
    agencyRoutingNumber: ResearchApplication.agencyRoutingNumber;
    previousTrackingId: ResearchApplication.previousTrackingId;
    applicationType: ResearchApplication.applicationType;

    @UI.flatten
    @UI.field(ResearchApplication.revision)
    revision: {
      @UI.enabledWhen(
        ResearchCover.application::type.applicationType,
        ResearchApplicationType.Revision
      )
      type: ResearchRevision.type;

      otherSpecify: ResearchRevision.otherSpecify;
    };

    @UI.flatten otherAgencies: ResearchApplication.otherAgencies;
  };

  @UI.label("Applicant Organization")
  @UI.field(ResearchCover.applicant)
  applicant: {
    @UI.flatten
    @UI.field(ResearchApplicant.organization)
    organization: {
      name: ResearchOrganization.name;
      uei: ResearchOrganization.uei;
      department: ResearchOrganization.department;
      division: ResearchOrganization.division;
      @UI.flatten address: ResearchOrganization.address;
      ein: ResearchOrganization.ein;
    };
  };

  @UI.label("Applicant Contact")
  @UI.field(ResearchCover.contacts)
  contacts: {
    @UI.flatten
    @UI.field(ResearchContacts.pointOfContact)
    pointOfContact: {
      @UI.flatten name: ResearchContactPerson.name;
      title: ResearchContactPerson.title;
      @UI.flatten address: ResearchContactPerson.address;
      phone: ResearchContactPerson.phone;
      fax: ResearchContactPerson.fax;
      email: ResearchContactPerson.email;
    };
  };

  @UI.label("Type of Applicant")
  @UI.field(ResearchCover.applicant::type.type)
  type: {
    code: ResearchApplicantType.code;
    otherSpecify: ResearchApplicantType.otherSpecify;
    smallBusiness: ResearchApplicantType.smallBusiness;
  };

  @UI.label("Opportunity")
  @UI.field(ResearchCover.opportunity)
  opportunity: {
    agencyName: ResearchOpportunity.agencyName;

    // Give the listing R&R's own DAT help; the shared model words it for the other variants.
    @UI.flatten
    @UI.field(ResearchOpportunity.assistanceListing)
    assistanceListing: {
      /** This is the Assistance Listing number of the program under which assistance is requested. This field is pre-populated from the opportunity package. */
      number: Questions.Opportunities.AssistanceListing.number;

      /** This is the Assistance Listing title of the program under which assistance is requested. This field is pre-populated from the opportunity package. */
      title: Questions.Opportunities.AssistanceListing.title;
    };
  };

  @UI.label("Proposed Project")
  @UI.field(ResearchCover.project)
  project: {
    title: ResearchProject.title;
    @UI.flatten timeline: ResearchProject.timeline;
    congressionalDistrict: ResearchCover.applicant::type.congressionalDistrict;
  };

  @UI.label("Project Director / Principal Investigator")
  @UI.field(ResearchCover.contacts::type.projectDirector)
  projectDirector: {
    @UI.flatten name: ResearchContact.name;
    title: ResearchContact.title;
    @UI.flatten organization: ResearchContact.organization;
    @UI.flatten address: ResearchContact.address;
    phone: ResearchContact.phone;
    fax: ResearchContact.fax;
    email: ResearchContact.email;
  };

  @UI.label("Estimated Project Funding")
  @UI.field(ResearchCover.budget)
  budget: {
    @UI.flatten fundingSources: ResearchBudget.fundingSources;
  };

  @UI.label("State Review")
  @UI.field(ResearchCover.application::type.stateReview)
  stateReview: {
    status: ResearchStateReview.status;
    date: ResearchStateReview.date;
  };

  /**
   * By signing this application, I certify (1) to the statements contained in the list of certifications* and (2) that the statements herein are true, complete and accurate to the best of my knowledge. I also provide the required assurances* and agree to comply with any resulting terms if I accept an award. I am aware that any false, fictitious, or fraudulent statements or claims may subject me to criminal, civil, or administrative penalties. (U.S. Code, Title 18, Section 1001)
   *
   * * The list of certifications and assurances, or an internet site where you may obtain this list, is contained in the announcement or agency specific instructions.
   */
  @UI.label("Certification")
  @UI.field(ResearchCover.certification)
  certification: {
    /** Check "I agree" to provide the required certifications and assurances. This field is required. */
    @UI.label("I agree")
    agree: Questions.Certifications.Certification.agree;

    @UI.label("Signature of Authorized Representative")
    signature: Questions.Certifications.Certification.signature;

    dateSigned: Questions.Certifications.Certification.dateSigned;
  };

  @UI.label("Authorized Organization Representative")
  @UI.field(ResearchCover.contacts::type.authorizedRepresentative)
  authorizedRepresentative: {
    @UI.flatten name: ResearchContact.name;
    title: ResearchContact.title;
    @UI.flatten organization: ResearchContact.organization;
    @UI.flatten address: ResearchContact.address;
    phone: ResearchContact.phone;
    fax: ResearchContact.fax;
    email: ResearchContact.email;
  };

  @UI.label("Supporting Files")
  @UI.field(ResearchCover.attachments)
  attachments: {
    lobbyingDisclosure: ResearchAttachments.lobbyingDisclosure;
    preApplication: ResearchAttachments.preApplication;
    coverLetter: ResearchAttachments.coverLetter;
  };
}
