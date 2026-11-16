import "simpler-forms";
import "form-library-xml";
import "#forms/index.tsp";
import "./examples.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;
namespace Forms.OtherNarrative;
@Meta.form(#{ id: "other-narrative", formName: "Other Narrative Attachments" })
@GrantsGov.form(#{
  legacyFormId: 542,
  shortFormName: "OtherNarrativeAttachments",
  formVersion: "1.2",
  agencyCode: "SGG",
})
@example(Examples.oneFile, #{ title: "One other narrative file" })
@example(Examples.twoFiles, #{ title: "Two ordered other narrative files" })
model OtherNarrative {
  @doc("At least one file must be attached")
  @UI.label("Other Narrative Files")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @minItems(1)
  @maxItems(100)
  attachments: Questions.Types.Attachment[];
}
