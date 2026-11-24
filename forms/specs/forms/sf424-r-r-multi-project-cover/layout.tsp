import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.SF424ResearchMultiProject;

// R&R's sections, in the same order. Each section that shows part of a nested group names it
// with `::type`, from the form root.
@UI.layout(MultiProjectCover)
model MultiProjectCoverLayout {
  @UI.label("Submission and Application")
  @UI.field(MultiProjectCover.application)
  application: {
    submissionType: MultiProjectApplication.submissionType;
    dateSubmitted: MultiProjectApplication.dateSubmitted;
    applicantId: MultiProjectApplication.applicantId;
    @UI.flatten state: MultiProjectApplication.state;
    federalIdentifier: MultiProjectApplication.federalIdentifier;
    agencyRoutingNumber: MultiProjectApplication.agencyRoutingNumber;
    previousTrackingId: MultiProjectApplication.previousTrackingId;
    applicationType: MultiProjectApplication.applicationType;

    @UI.flatten
    @UI.field(MultiProjectApplication.revision)
    revision: {
      @UI.enabledWhen(
        MultiProjectCover.application::type.applicationType,
        Forms.SF424Research.ResearchApplicationType.Revision
      )
      type: MultiProjectRevision.type;

      otherSpecify: MultiProjectRevision.otherSpecify;
    };

    @UI.flatten otherAgencies: MultiProjectApplication.otherAgencies;
  };

  @UI.label("Applicant Organization")
  @UI.field(MultiProjectCover.applicant)
  applicant: {
    @UI.flatten
    @UI.field(MultiProjectApplicant.organization)
    organization: {
      name: MultiProjectOrganization.name;
      uei: MultiProjectOrganization.uei;
      department: MultiProjectOrganization.department;
      division: MultiProjectOrganization.division;
      @UI.flatten address: MultiProjectOrganization.address;
      ein: MultiProjectOrganization.ein;
    };
  };

  @UI.label("Applicant Contact")
  @UI.field(MultiProjectCover.contacts)
  contacts: {
    @UI.flatten
    @UI.field(MultiProjectContacts.pointOfContact)
    pointOfContact: {
      @UI.flatten name: MultiProjectContactPerson.name;
      title: MultiProjectContactPerson.title;
      @UI.flatten address: MultiProjectContactPerson.address;
      phone: MultiProjectContactPerson.phone;
      fax: MultiProjectContactPerson.fax;
      email: MultiProjectContactPerson.email;
    };
  };

  @UI.label("Type of Applicant")
  @UI.field(MultiProjectCover.applicant::type.type)
  type: {
    code: MultiProjectApplicantType.code;
    otherSpecify: MultiProjectApplicantType.otherSpecify;
    smallBusiness: MultiProjectApplicantType.smallBusiness;
  };

  @UI.label("Opportunity")
  @UI.field(MultiProjectCover.opportunity)
  opportunity: {
    agencyName: MultiProjectOpportunity.agencyName;

    // Give the listing R&R's own DAT help; the shared model words it for the other variants.
    @UI.flatten
    @UI.field(MultiProjectOpportunity.assistanceListing)
    assistanceListing: {
      /** This is the Assistance Listing number of the program under which assistance is requested. This field is pre-populated from the opportunity package. */
      number: Questions.Opportunities.AssistanceListing.number;

      /** This is the Assistance Listing title of the program under which assistance is requested. This field is pre-populated from the opportunity package. */
      title: Questions.Opportunities.AssistanceListing.title;
    };
  };

  @UI.label("Proposed Project")
  @UI.field(MultiProjectCover.project)
  project: {
    title: MultiProjectProject.title;
    @UI.flatten timeline: MultiProjectProject.timeline;
    congressionalDistrict: MultiProjectCover.applicant::type.congressionalDistrict;
  };

  @UI.label("Project Director / Principal Investigator")
  @UI.field(MultiProjectCover.contacts::type.projectDirector)
  projectDirector: {
    @UI.flatten name: MultiProjectContact.name;
    title: MultiProjectContact.title;
    @UI.flatten organization: MultiProjectContact.organization;
    @UI.flatten address: MultiProjectContact.address;
    phone: MultiProjectContact.phone;
    fax: MultiProjectContact.fax;
    email: MultiProjectContact.email;
  };

  @UI.label("Estimated Project Funding")
  @UI.field(MultiProjectCover.budget)
  budget: {
    @UI.flatten fundingSources: MultiProjectBudget.fundingSources;
  };

  @UI.label("State Review")
  @UI.field(MultiProjectCover.application::type.stateReview)
  stateReview: {
    status: MultiProjectStateReview.status;
    date: MultiProjectStateReview.date;
  };

  /**
   * By signing this application, I certify (1) to the statements contained in the list of certifications* and (2) that the statements herein are true, complete and accurate to the best of my knowledge. I also provide the required assurances* and agree to comply with any resulting terms if I accept an award. I am aware that any false, fictitious, or fraudulent statements or claims may subject me to criminal, civil, or administrative penalties. (U.S. Code, Title 18, Section 1001)
   *
   * * The list of certifications and assurances, or an internet site where you may obtain this list, is contained in the announcement or agency specific instructions.
   */
  @UI.label("Certification")
  @UI.field(MultiProjectCover.certification)
  certification: {
    /** Check "I agree" to provide the required certifications and assurances. */
    @UI.label("I agree")
    agree: MultiProjectCertification.agree;

    @UI.label("Signature of Authorized Representative")
    signature: MultiProjectCertification.signature;

    dateSigned: MultiProjectCertification.dateSigned;
  };

  @UI.label("Authorized Organization Representative")
  @UI.field(MultiProjectCover.contacts::type.authorizedRepresentative)
  authorizedRepresentative: {
    @UI.flatten name: MultiProjectContact.name;
    title: MultiProjectContact.title;
    @UI.flatten organization: MultiProjectContact.organization;
    @UI.flatten address: MultiProjectContact.address;
    phone: MultiProjectContact.phone;
    fax: MultiProjectContact.fax;
    email: MultiProjectContact.email;
  };

  @UI.label("Supporting Files")
  @UI.field(MultiProjectCover.attachments)
  attachments: {
    lobbyingDisclosure: Forms.SF424Research.ResearchAttachments.lobbyingDisclosure;
    preApplication: Forms.SF424Research.ResearchAttachments.preApplication;
    coverLetter: Forms.SF424Research.ResearchAttachments.coverLetter;
  };
}
