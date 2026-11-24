import "simpler-forms";
import "form-library-xml";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "./examples.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;
namespace Forms.ProjectNarrative;
@Meta.form(#{
  id: "project-narrative",
  formName: "Project Narrative Attachment Form",
})
@Sgg.sync(#{
  instructions: "0d894c0a-ee30-4e34-b9c4-8d02df8bb7b8",
  xml: "mapping",
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
  /** At least one file must be attached */
  @UI.label("Project Narrative Files")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @minItems(1)
  @maxItems(100)
  attachments: Questions.Types.Attachment[];
}
