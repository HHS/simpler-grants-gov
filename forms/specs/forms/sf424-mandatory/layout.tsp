import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.SF424Mandatory;

// =============================================================================
// FORM LAYOUT
// =============================================================================

// The paper form's sections, in its order. Reference a field outside its section's group
// from the form's root (`SF424Mandatory.application::type.dateReceived`).
@UI.layout(SF424Mandatory)
model MandatoryLayout {
  @UI.label("Submission Information")
  @UI.field(SF424Mandatory.application)
  application: {
    @UI.label("Type of Submission")
    submissionType: MandatoryApplication.submissionType;

    @UI.label("Type of Submission - Other (specify)")
    submissionTypeOther: MandatoryApplication.submissionTypeOther;

    @UI.flatten
    @UI.field(MandatoryApplication.frequency)
    frequency: {
      @UI.label("Frequency")
      code: MandatoryFrequency.code;

      @UI.label("Frequency - Other (specify)")
      other: MandatoryFrequency.other;
    };

    @UI.flatten
    @UI.field(MandatoryApplication.consolidatedRequest)
    consolidatedRequest: {
      @UI.label("Consolidated Application/Plan/Funding Request?")
      answer: MandatoryConsolidatedRequest.answer;

      @UI.label("Consolidated Request Explanation")
      explanation: MandatoryConsolidatedRequest.explanation;
    };

    @UI.label("Version")
    version: MandatoryApplication.version;
  };

  @UI.label("Dates")
  dates: {
    @UI.label("Date Received")
    dateReceived: SF424Mandatory.application::type.dateReceived;

    @UI.label("Date Received by State")
    state: SF424Mandatory.application::type.state::type.receivedDate;
  };

  @UI.label("Identifiers")
  identifiers: {
    @UI.label("Applicant Identifier")
    applicantId: SF424Mandatory.application::type.applicantId;

    @UI.label("Federal Entity Identifier")
    federalEntityIdentifier: SF424Mandatory.application::type.federalEntityIdentifier;

    @UI.label("Federal Award Identifier")
    federalAwardIdentifier: SF424Mandatory.application::type.federalAwardIdentifier;

    @UI.label("State Application Identifier")
    state: SF424Mandatory.application::type.state::type.applicationId;
  };

  @UI.label("Applicant Organization")
  @UI.field(SF424Mandatory.applicant)
  applicant: {
    @UI.flatten
    @UI.field(MandatoryApplicant.organization)
    organization: {
      @UI.label("Legal Name")
      name: MandatoryApplicantOrganization.name;

      @UI.label("EIN/TIN")
      ein: MandatoryApplicantOrganization.ein;

      @UI.label("UEI")
      uei: MandatoryApplicantOrganization.uei;

      @UI.flatten address: MandatoryApplicantOrganization.address;

      @UI.label("Department Name")
      department: MandatoryApplicantOrganization.department;

      @UI.label("Division Name")
      division: MandatoryApplicantOrganization.division;
    };

    @UI.flatten
    @UI.field(MandatoryApplicant.type)
    type: {
      @UI.label("Type of Applicant")
      code: MandatoryApplicantType.code;

      @UI.label("Other (specify)")
      otherSpecify: MandatoryApplicantType.otherSpecify;

      @UI.label("Additional Description")
      additionalDescription: MandatoryApplicantType.additionalDescription;
    };
  };

  @UI.label("Contact Person")
  @UI.field(SF424Mandatory.contacts)
  contacts: {
    @UI.flatten
    @UI.field(MandatoryContacts.pointOfContact)
    pointOfContact: {
      @UI.flatten name: MandatoryPointOfContact.name;
      title: MandatoryPointOfContact.title;
      @UI.flatten organization: MandatoryPointOfContact.organization;
      phone: MandatoryPointOfContact.phone;
      fax: MandatoryPointOfContact.fax;
      email: MandatoryPointOfContact.email;
    };
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
    @UI.label("Descriptive Title of Applicant's Project")
    title: MandatoryProject.title;

    @UI.label("Areas Affected by Funding")
    areasAffected: MandatoryProject.areasAffected;
  };

  @UI.label("Congressional Districts")
  congressionalDistricts: {
    @UI.label("Applicant Congressional District")
    applicant: SF424Mandatory.applicant::type.congressionalDistrict;

    @UI.label("Program/Project Congressional District")
    project: SF424Mandatory.project::type.congressionalDistrict;

    @UI.label("Additional Congressional Districts Attachment")
    additionalCongressionalDistricts: SF424Mandatory.project::type.additionalCongressionalDistricts;
  };

  @UI.label("Funding Period and Estimated Funding")
  @UI.field(SF424Mandatory.budget)
  budget: {
    @UI.flatten
    @UI.field(MandatoryBudget.fundingPeriod)
    fundingPeriod: {
      @UI.label("Funding Period Start Date")
      startDate: MandatoryFundingPeriod.startDate;

      @UI.label("Funding Period End Date")
      endDate: MandatoryFundingPeriod.endDate;
    };

    @UI.flatten
    @UI.field(MandatoryBudget.fundingSources)
    fundingSources: {
      @UI.label("Estimated Funding - Federal")
      federal: MandatoryFundingSources.federal;

      @UI.label("Estimated Funding - Match")
      match: MandatoryFundingSources.match;
    };
  };

  @UI.label("State Review")
  @UI.field(SF424Mandatory.application::type.stateReview)
  stateReview: {
    @UI.label("Is Submission Subject to Review by State Under Executive Order 12372?")
    status: MandatoryStateReview.status;

    @UI.label("State Review Available Date")
    date: MandatoryStateReview.date;
  };

  @UI.label("Federal Debt")
  @UI.field(SF424Mandatory.applicant::type.delinquentFederalDebt)
  delinquentFederalDebt: {
    @UI.label("Is the Applicant Delinquent on Any Federal Debt?")
    answer: MandatoryDelinquentFederalDebt.answer;

    @UI.label("Federal Debt Delinquency Explanation")
    explanation: MandatoryDelinquentFederalDebt.explanation;
  };

  /**
   * 18. By signing this application, I certify (1) to the statements contained in the list of certifications** and (2) that the statements herein are true, complete and accurate to the best of my knowledge. I also provide the required assurances** and agree to comply with any resulting terms if I accept an award. I am aware that any false, fictitious, or fraudulent statements or claims may subject me to criminal, civil, or administrative penalties. (U.S. Code, Title 18, Section 1001)
   *
   * ** This list of certifications and assurances, or an internet site where you may obtain this list, is contained in the announcement or agency specific instructions.
   */
  @UI.label("Certification")
  @UI.field(SF424Mandatory.certification)
  certification: {
    @UI.label("Application Certification (I Agree)")
    agree: Questions.Certifications.Certification.agree;
  };

  @UI.label("Authorized Representative")
  authorizedRepresentative: {
    @UI.flatten
    @UI.field(SF424Mandatory.contacts::type.authorizedRepresentative)
    authorizedRepresentative: {
      @UI.flatten name: MandatoryAuthorizedRepresentative.name;
      title: MandatoryAuthorizedRepresentative.title;
      @UI.flatten organization: MandatoryAuthorizedRepresentative.organization;
      phone: MandatoryAuthorizedRepresentative.phone;
      fax: MandatoryAuthorizedRepresentative.fax;
      email: MandatoryAuthorizedRepresentative.email;
    };

    @UI.label("Signature of Authorized Representative")
    signature: SF424Mandatory.certification::type.signature;

    @UI.label("Date Signed")
    dateSigned: SF424Mandatory.certification::type.dateSigned;
  };

  @UI.label("Attachments")
  @UI.field(SF424Mandatory.attachments)
  attachments: {
    @UI.label("Supporting Documents")
    additional: MandatoryAttachments.additional;
  };
}
