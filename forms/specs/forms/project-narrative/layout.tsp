import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.ProjectNarrative;
@UI.layout(ProjectNarrative)
model ProjectNarrativeLayout {
  @UI.label("1. Project Narrative File(s)")
  files: {
    attachments: ProjectNarrative.attachments;
  };
}
