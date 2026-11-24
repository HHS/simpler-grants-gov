import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.SF424Individual;

// =============================================================================
// FORM LAYOUT
// =============================================================================

// The paper form's sections, with Date Received after the opportunity values.
@UI.layout(SF424Individual)
model SF424IndividualLayout {
  /** These values come from the funding opportunity. */
  @UI.label("Opportunity Information")
  @UI.field(SF424Individual.opportunity)
  opportunity: {
    agencyName: SF424IndividualOpportunity.agencyName;
    @UI.flatten assistanceListing: SF424IndividualOpportunity.assistanceListing;
    number: SF424IndividualOpportunity.number;
    title: SF424IndividualOpportunity.title;
  };

  @UI.label("Application Information")
  @UI.field(SF424Individual.application)
  application: {
    dateReceived: SF424IndividualApplication.dateReceived;
  };

  // Current SGG fieldsets use a fixed heading level. Show one applicant section until
  // nested headings are supported; the answer keeps its own nesting.
  @UI.label("Applicant Information")
  applicant: {
    @UI.flatten
    @UI.field(SF424Individual.contacts)
    contacts: {
      @UI.flatten
      @UI.field(SF424IndividualContacts.pointOfContact)
      pointOfContact: {
        @UI.flatten name: SF424IndividualPointOfContact.name;
        phone: SF424IndividualPointOfContact.phone;

        @UI.label("Phone Number (Evening)")
        eveningPhone: SF424IndividualPointOfContact.eveningPhone;

        fax: SF424IndividualPointOfContact.fax;
        email: SF424IndividualPointOfContact.email;
        @UI.flatten address: SF424IndividualPointOfContact.address;
      };
    };

    @UI.flatten
    @UI.field(SF424Individual.applicant)
    applicant: {
      @UI.flatten
      @UI.field(SF424IndividualApplicant.person)
      person: {
        @UI.flatten
        @UI.field(SF424IndividualPerson.citizenship)
        citizenship: {
          @UI.label("U.S. Citizenship")
          isUsCitizen: SF424IndividualCitizenship.isUsCitizen;

          @UI.label("If permanent resident of U.S., enter the Alien Registration #")
          alienRegistrationNumber: SF424IndividualCitizenship.alienRegistrationNumber;

          @UI.label("If foreign national, enter country of citizenship")
          country: SF424IndividualCitizenship.country;

          @UI.label("If foreign national, enter start date of most recent residency in U.S.")
          residencyStartDate: SF424IndividualCitizenship.residencyStartDate;
        };
      };

      @UI.label("Congressional District of Applicant")
      congressionalDistrict: SF424IndividualApplicant.congressionalDistrict;
    };
  };

  @UI.label("Project Information")
  @UI.field(SF424Individual.project)
  project: {
    title: SF424IndividualProject.title;
    description: SF424IndividualProject.description;
    @UI.flatten timeline: SF424IndividualProject.timeline;
  };

  /**
   * By signing this application, I certify (1) to the statements contained in the list of certifications** and (2) that the statements herein are true, complete and accurate to the best of my knowledge. I also provide the required assurances** and agree to comply with any resulting terms if I accept an award. I am aware that any false, fictitious, or fradulent statements or claims may subject me to criminal, civil, or administrative penalties (U.S. Code, Title 18, Section 1001)
   *
   * ** The list of certifications and assurances, or an internet site where you may obtain this list, is contained in the announcement or agency specific instructions.
   */
  @UI.label("Certification")
  @UI.field(SF424Individual.certification)
  certification: {
    agree: Questions.Certifications.Certification.agree;
    signature: Questions.Certifications.Certification.signature;
    dateSigned: Questions.Certifications.Certification.dateSigned;
  };
}
