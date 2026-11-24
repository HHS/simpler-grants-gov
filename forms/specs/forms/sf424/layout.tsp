import "simpler-forms";

import "./form.tsp";

using SimplerForms;
namespace Forms.SF424Regular;

// =============================================================================
// FORM LAYOUT
// =============================================================================

// The paper form's sections, in its order. Some sections show fields from more than one
// part of the answer, such as the two congressional districts under Project Information.
@UI.layout(SF424)
model SF424Layout {
  @UI.label("Application Information")
  @UI.field(SF424.application)
  application: {
    @UI.label("Submission Type")
    submissionType: SF424Application.submissionType;

    @UI.label("Application Type")
    applicationType: SF424Application.applicationType;

    @UI.flatten
    @UI.field(SF424Application.revision)
    revision: {
      @UI.label("Revision Type")
      @UI.enabledWhen(
        SF424.application::type.applicationType,
        SF424ApplicationType.Revision
      )
      type: SF424Revision.type;

      @UI.label("Other Explanation")
      otherSpecify: SF424Revision.otherSpecify;
    };

    @UI.label("Date Received")
    dateReceived: SF424Application.dateReceived;

    @UI.label("Applicant Identifier")
    applicantId: SF424Application.applicantId;

    @UI.label("Federal Entity Identifier")
    federalEntityIdentifier: SF424Application.federalEntityIdentifier;

    @UI.label("Federal Award Identifier")
    federalAwardIdentifier: SF424Application.federalAwardIdentifier;

    @UI.flatten
    @UI.field(SF424Application.state)
    state: {
      @UI.label("Date Received By State")
      receivedDate: SF424StateApplication.receivedDate;

      @UI.label("State Application Identifier")
      applicationId: SF424StateApplication.applicationId;
    };
  };

  @UI.label("Applicant Organization")
  @UI.field(SF424.applicant)
  applicant: {
    @UI.flatten
    @UI.field(SF424Applicant.organization)
    organization: {
      @UI.label("Legal Name")
      name: SF424ApplicantOrganization.name;

      @UI.label("EIN/TIN")
      ein: SF424ApplicantOrganization.ein;

      @UI.label("UEI")
      uei: SF424ApplicantOrganization.uei;

      @UI.flatten address: SF424ApplicantOrganization.address;

      @UI.label("Department Name")
      department: SF424ApplicantOrganization.department;

      @UI.label("Division Name")
      division: SF424ApplicantOrganization.division;
    };
  };

  @UI.label("Contact Person")
  @UI.field(SF424.contacts)
  contacts: {
    @UI.flatten
    @UI.field(SF424Contacts.pointOfContact)
    pointOfContact: {
      @UI.flatten name: SF424PointOfContact.name;

      @UI.label("Title")
      title: SF424PointOfContact.title;

      @UI.flatten
      @UI.field(SF424PointOfContact.organization)
      organization: {
        @UI.label("Organizational Affiliation")
        name: SF424ContactOrganization.name;
      };

      @UI.label("Phone Number")
      phone: SF424PointOfContact.phone;

      @UI.label("Fax Number")
      fax: SF424PointOfContact.fax;

      @UI.label("Email")
      email: SF424PointOfContact.email;
    };
  };

  @UI.label("Applicant Type")
  @UI.field(SF424.applicant::type.type)
  type: {
    @UI.label("Type of Applicant")
    codes: SF424ApplicantType.codes;

    @UI.label("Type of Applicant Other Explanation")
    otherSpecify: SF424ApplicantType.otherSpecify;
  };

  @UI.label("Opportunity Information")
  @UI.field(SF424.opportunity)
  opportunity: {
    @UI.label("Agency Name")
    agencyName: SF424Opportunity.agencyName;

    @UI.flatten assistanceListing: SF424Opportunity.assistanceListing;

    @UI.label("Opportunity Number")
    number: SF424Opportunity.number;

    @UI.label("Opportunity title")
    title: SF424Opportunity.title;

    @UI.flatten
    @UI.field(SF424Opportunity.competition)
    competition: {
      @UI.label("Competition Number")
      number: SF424Competition.number;

      @UI.label("Competition Title")
      title: SF424Competition.title;
    };
  };

  @UI.label("Project Information")
  @UI.field(SF424.project)
  project: {
    @UI.label("Areas Affected")
    areasAffected: SF424Project.areasAffected;

    @UI.label("Project Title")
    title: SF424Project.title;

    @UI.label("Additional Project Title")
    additionalTitles: SF424Project.additionalTitles;

    // Item 16a asks for the applicant's district beside the project's.
    @UI.label("Applicant District")
    applicant: SF424.applicant::type.congressionalDistrict;

    @UI.label("Program District")
    congressionalDistrict: SF424Project.congressionalDistrict;

    @UI.label("Additional Congressional Districts")
    additionalCongressionalDistricts: SF424Project.additionalCongressionalDistricts;

    @UI.flatten
    @UI.field(SF424Project.timeline)
    timeline: {
      @UI.label("Project Start Date")
      startDate: SF424ProjectTimeline.startDate;

      @UI.label("Project End Date")
      endDate: SF424ProjectTimeline.endDate;
    };
  };

  @UI.label("Estimated Funding")
  @UI.field(SF424.budget)
  budget: {
    @UI.flatten
    @UI.field(SF424Budget.fundingSources)
    fundingSources: {
      @UI.label("Federal Estimated Funding")
      federal: SF424FundingSources.federal;

      @UI.label("Applicant Estimated Funding")
      applicant: SF424FundingSources.applicant;

      @UI.label("State Estimated Funding")
      state: SF424FundingSources.state;

      @UI.label("Local Estimated Funding")
      local: SF424FundingSources.local;

      @UI.label("Other Estimated Funding")
      other: SF424FundingSources.other;

      @UI.label("Program Income Estimated Funding")
      programIncome: SF424FundingSources.programIncome;

      @UI.label("Total Estimated Funding")
      total: SF424FundingSources.total;
    };
  };

  @UI.label("State Review")
  @UI.field(SF424.application::type.stateReview)
  stateReview: {
    @UI.label("Is Application Subject to Review By State Under Executive Order 12372 Process?")
    status: SF424StateReview.status;

    @UI.label("State Review Date")
    date: SF424StateReview.date;
  };

  @UI.label("Federal Debt")
  @UI.field(SF424.applicant::type.delinquentFederalDebt)
  delinquentFederalDebt: {
    @UI.label("Applicant Delinquent on Federal Debt")
    answer: SF424DelinquentFederalDebt.answer;

    @UI.label("Debt Explanation")
    explanation: SF424DelinquentFederalDebt.explanation;
  };

  /**
   * 21. *By signing this application, I certify (1) to the statements contained in the list of certifications** and (2) that the statements herein are true, complete and accurate to the best of my knowledge. I also provide the required assurances** and agree to comply with any resulting terms if I accept an award. I am aware that any false, fictitious, or fraudulent statements or claims may subject me to criminal, civil, or administrative penalties. (U.S. Code, Title 18, Section 1001)
   *
   * ** The list of certifications and assurances, or an internet site where you may obtain this list, is contained in the announcement or agency specific instructions.
   */
  @UI.label("Certification")
  @UI.field(SF424.certification)
  certification: {
    @UI.label("I Agree")
    agree: Questions.Certifications.Certification.agree;
  };

  // Grants.gov signs and dates the certification in the representative's name, so show
  // the signature and date with the representative.
  @UI.label("Authorized Representative")
  @UI.field(SF424.contacts::type.authorizedRepresentative)
  authorizedRepresentative: {
    @UI.flatten name: SF424AuthorizedRepresentative.name;

    @UI.label("Title")
    title: SF424AuthorizedRepresentative.title;

    @UI.label("Phone Number")
    phone: SF424AuthorizedRepresentative.phone;

    @UI.label("Email")
    email: SF424AuthorizedRepresentative.email;

    @UI.label("Fax Number")
    fax: SF424AuthorizedRepresentative.fax;

    @UI.label("Signature")
    signature: SF424.certification::type.signature;

    @UI.label("Date Signed")
    dateSigned: SF424.certification::type.dateSigned;
  };
}
