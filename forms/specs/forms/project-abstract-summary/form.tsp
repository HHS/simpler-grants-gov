import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
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
@example(
  #{
    fundingOpportunityNumber: "ABC-123",
    applicantName: "My Company LLC",
    projectTitle: "Research into Science",
    projectAbstract: "We plan to do research on science",
  },
  #{
    title: "Minimal valid summary v2 0",
    description: "Pinned SGG fixture, preserving exact existing answer names.",
  }
)
@example(
  #{
    fundingOpportunityNumber: "XYZ-456",
    assistanceListingNumber: "12.345",
    applicantName: "My Business Inc",
    projectTitle: "Space Exploration",
    projectAbstract: "We are going to Pluto",
  },
  #{
    title: "Full valid summary v2 0",
    description: "Pinned SGG fixture, preserving exact existing answer names.",
  }
)
model ProjectAbstractSummary {
  @doc("Funding Opportunity Number for the particular program announcement. Pre-populated from the Application cover sheet. This field is required.")
  @UI.label("Funding Opportunity Number")
  @minLength(1)
  @maxLength(40)
  @UI.widget(Rendering.Widget.Text)
  fundingOpportunityNumber: string;

  @doc("Assistance Listing Number assigned to the Program. Pre-populated from the Application cover sheet.")
  @UI.label("Assistance Listing Number(s)")
  @minLength(1)
  @maxLength(15)
  @UI.widget(Rendering.Widget.Text)
  assistanceListingNumber?: string;

  @doc("This is the legal name of applicant which will undertake the assistance activity. This field is required.")
  @UI.label("Applicant Name")
  @minLength(1)
  @maxLength(60)
  @UI.widget(Rendering.Widget.Text)
  applicantName: Questions.Organizations.OrgName;

  @doc("This is the project title or brief description of the project. This field is required.")
  @UI.label("Descriptive Title of Applicant's Project")
  @minLength(1)
  @maxLength(250)
  @UI.widget(Rendering.Widget.TextArea)
  projectTitle: string;

  @doc("Enter a work summary or abstract of the work to be performed under this project. This field is required.")
  @UI.label("Project Abstract")
  @minLength(1)
  @maxLength(4000)
  @UI.widget(Rendering.Widget.TextArea)
  projectAbstract: string;
}
