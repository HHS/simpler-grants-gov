import "simpler-forms";
import "simpler-forms-sgg";
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
@Sgg.sync(#{
  instructions: "f8b3c40c-cc55-4b58-ac38-1837b8ae4922",
  xml: "mapping",
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
  /** At least one file must be attached */
  @UI.label("Budget Narrative Files")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @minItems(1)
  @maxItems(100)
  attachments: Questions.Types.Attachment[];
}
