import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.ProjectAbstract;

@UI.layout(ProjectAbstract)
model ProjectAbstractLayout {
  @doc("The Project Abstract must not exceed one page and must contain a summary of the proposed activity suitable for dissemination to the public.  It should be a self-contained description of the project and should contain a statement of objectives and methods to be employed.  It should be informative to other persons working in the same or related fields and insofar as possible understandable to a technically literate lay reader.  This Abstract must not include any proprietary/confidential information.   ")
  @UI.label("Project Abstract File")
  section1: {
    attachment: ProjectAbstract.attachment;
  };
}
