import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "./examples.tsp";
import "#questions/organization/index.tsp";

using SimplerForms;

namespace Forms.ProjectAbstractSummary;

@Meta.form(#{
  id: "project-abstract-summary",
  formName: "Project Abstract Summary",
})
@GrantsGov.form(#{
  legacyFormId: 591,
  shortFormName: "Project_AbstractSummary_2_0",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "4040-0019",
  expirationDate: "2028-06-30",
})
@example(Examples.requiredFields, #{ title: "Required fields" })
@example(Examples.allFields, #{ title: "All fields" })
model ProjectAbstractSummary {
  /** SGG fills this from the selected funding opportunity. */
  @UI.label("Funding Opportunity Number")
  @minLength(1)
  @maxLength(40)
  @UI.widget(Rendering.Widget.Text)
  @Sgg.prePopulate(Sgg.PrePopulationRule.opportunityNumber)
  fundingOpportunityNumber: string;

  /** SGG fills this when the competition or opportunity supplies an assistance listing. */
  @UI.label("Assistance Listing Number(s)")
  @minLength(1)
  @maxLength(15)
  @UI.widget(Rendering.Widget.Text)
  @Sgg.prePopulate(Sgg.PrePopulationRule.assistanceListingNumber)
  assistanceListingNumber?: string;

  /**
   * This is the legal name of applicant which will undertake the assistance activity. This field is required.
   */
  @UI.label("Applicant Name")
  @UI.widget(Rendering.Widget.Text)
  applicantName: Questions.Organizations.OrgName;

  /** This is the project title or brief description of the project. This field is required. */
  @UI.label("Descriptive Title of Applicant's Project")
  @minLength(1)
  @maxLength(250)
  @UI.widget(Rendering.Widget.Text)
  projectTitle: string;

  /**
   * Enter a work summary or abstract of the work to be performed under this project. This field is required.
   */
  @UI.label("Project Abstract")
  @minLength(1)
  @maxLength(4000)
  @UI.widget(Rendering.Widget.TextArea)
  projectAbstract: string;
}
