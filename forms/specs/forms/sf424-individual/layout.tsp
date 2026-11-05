import "simpler-forms";
import "./form.tsp";

using SimplerForms;
namespace Forms.SF424Individual;

@UI.layout(SF424Individual)
model Layout {
  /** These values come from the funding opportunity. */
  @UI.label("Opportunity Information")
  @UI.field(SF424Individual.opportunity)
  opportunity: {
    agencyName: Opportunity.agencyName;
    @UI.flatten assistanceListing: Opportunity.assistanceListing;
    number: Opportunity.number;
    title: Opportunity.title;
  };

  @UI.label("Application Information")
  application: {
    dateReceived: SF424Individual.dateReceived;
  };

  // Current SGG fieldsets use a fixed heading level. Keep one visible applicant
  // section until nested headings are supported; answer nesting remains unchanged.
  @UI.label("Applicant Information")
  @UI.field(SF424Individual.applicant)
  applicant: {
    @UI.flatten name: Applicant.name;
    phone: Applicant.phone;
    eveningPhone: Applicant.eveningPhone;
    fax: Applicant.fax;
    email: Applicant.email;
    @UI.flatten address: Applicant.address;
    @UI.flatten citizenship: Applicant.citizenship;
    congressionalDistrict: Applicant.congressionalDistrict;
  };

  @UI.label("Project Information")
  @UI.field(SF424Individual.project)
  project: {
    title: Project.title;
    description: Project.description;
    startDate: Project.startDate;
    endDate: Project.endDate;
  };

  /** By signing this application, I certify (1) to the statements contained in the list of certifications** and (2) that the statements herein are true, complete and accurate to the best of my knowledge. I also provide the required assurances** and agree to comply with any resulting terms if I accept an award. I am aware that any false, fictitious, or fradulent statements or claims may subject me to criminal, civil, or administrative penalties (U.S. Code, Title 18, Section 1001) */
  @UI.label("Certification")
  @UI.field(SF424Individual.certification)
  certification: {
    agree: Certification.agree;
    signature: Certification.signature;
    dateSigned: Certification.dateSigned;
  };
}
