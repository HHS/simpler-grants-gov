import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.ProjectAbstractSummary;

@UI.layout(ProjectAbstractSummary)
model ProjectAbstractSummaryLayout {
  @doc("This Project Abstract Summary form must be submitted or the application will be considered incomplete.   Ensure the Project Abstract field succinctly describes the project in plain language that the public can understand and use without the full proposal.  Use 4,000 characters or less. Do not include personally identifiable, sensitive or proprietary information.  Refer to Agency instructions for any additional Project Abstract field requirements.   If the application is funded, your project abstract information (as submitted) will be made available to public websites and/or databases including USAspending.gov.")
  @UI.label("Project Abstract Summary")
  section1: {
    fundingOpportunityNumber: ProjectAbstractSummary.fundingOpportunityNumber;
    assistanceListingNumber: ProjectAbstractSummary.assistanceListingNumber;
    applicantName: ProjectAbstractSummary.applicantName;
    projectTitle: ProjectAbstractSummary.projectTitle;
    projectAbstract: ProjectAbstractSummary.projectAbstract;
  };
}
