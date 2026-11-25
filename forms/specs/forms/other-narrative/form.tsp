import "simpler-forms";
import "simpler-forms-sgg";
import "form-library-xml";
import "#forms/index.tsp";
import "./examples.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;
namespace Forms.OtherNarrative;
@Meta.form(#{ id: "other-narrative", formName: "Other Narrative Attachments" })
@Sgg.sync(#{
  instructions: "cb2214f4-02d4-491b-ac5d-9abf32a1b7dc",
  xml: "mapping",
})
@GrantsGov.form(#{
  legacyFormId: 542,
  shortFormName: "OtherNarrativeAttachments",
  formVersion: "1.2",
  agencyCode: "SGG",
})
@example(Examples.oneFile, #{ title: "One other narrative file" })
@example(Examples.twoFiles, #{ title: "Two ordered other narrative files" })
model OtherNarrative {
  /** At least one file must be attached */
  @UI.label("Other Narrative Files")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @minItems(1)
  @maxItems(100)
  attachments: Questions.Types.Attachment[];
}
