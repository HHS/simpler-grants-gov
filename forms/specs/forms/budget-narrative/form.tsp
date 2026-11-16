import "simpler-forms";
import "form-library-xml";
import "#forms/index.tsp";
import "./examples.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;
namespace Forms.BudgetNarrative;
@Meta.form(#{
  id: "budget-narrative",
  formName: "Budget Narrative Attachment Form",
})
@GrantsGov.form(#{
  legacyFormId: 543,
  shortFormName: "BudgetNarrativeAttachments_1_2",
  formVersion: "1.2",
  agencyCode: "SGG",
})
@example(Examples.oneFile, #{ title: "One budget narrative file" })
@example(Examples.twoFiles, #{ title: "Two ordered budget narrative files" })
model BudgetNarrative {
  @doc("At least one file must be attached")
  @UI.label("Budget Narrative Files")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @minItems(1)
  @maxItems(100)
  attachments: Questions.Types.Attachment[];
}
