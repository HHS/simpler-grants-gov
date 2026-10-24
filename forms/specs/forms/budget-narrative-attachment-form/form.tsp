import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;
namespace Forms.BudgetNarrative;

@Meta.form(#{
  id: "budget-narrative-attachment-form",
  formName: "Budget Narrative Attachment Form",
})
@GrantsGov.form(#{
  legacyFormId: 543,
  shortFormName: "BudgetNarrativeAttachments_1_2",
  formVersion: "1.2",
  agencyCode: "SGG",
})
@example(
  #{ attachments: #["00000000-0000-0000-0000-000000000002"] },
  #{
    title: "One required file",
    description: "Lower cardinality boundary; UUID is illustrative and has no uploaded file behind it.",
  }
)
@example(
  #{
    attachments: #[
      "00000000-0000-0000-0000-000000000002",
      "00000000-0000-0000-0000-000000000003"
    ],
  },
  #{
    title: "Two ordered files",
    description: "A primary document followed by a supplementary file; array order is meaningful within this form, not shared answer identity across forms.",
  }
)
model BudgetNarrative {
  @doc("Attach at least one file. Keep files in the order required by the agency instructions. Up to 100 files may be supplied.")
  @UI.label("Budget Narrative Files")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @minItems(1)
  @maxItems(100)
  attachments: Questions.Types.Attachment[];
}
