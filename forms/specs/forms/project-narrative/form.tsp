import "simpler-forms";
import "form-library-xml";
import "#forms/index.tsp";
import "./examples.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;
namespace Forms.ProjectNarrative;
@Meta.form(#{
  id: "project-narrative",
  formName: "Project Narrative Attachment Form",
})
@GrantsGov.form(#{
  legacyFormId: 539,
  shortFormName: "ProjectNarrativeAttachments_1_2",
  formVersion: "1.2",
  agencyCode: "SGG",
})
@example(Examples.oneFile, #{ title: "One project narrative file" })
@example(Examples.twoFiles, #{ title: "Two ordered project narrative files" })
model ProjectNarrative {
  @doc("At least one file must be attached")
  @UI.label("Project Narrative Files")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @minItems(1)
  @maxItems(100)
  attachments: Questions.Types.Attachment[];
}
