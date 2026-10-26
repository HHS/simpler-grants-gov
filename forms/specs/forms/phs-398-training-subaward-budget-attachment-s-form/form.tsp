import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;
namespace Forms.PHSTrainingSubawardBudget;

@Meta.form(#{
  id: "phs-398-training-subaward-budget-attachment-s-form",
  formName: "PHS 398 Training Subaward Budget Attachment(s) Form",
})
@GrantsGov.form(#{
  legacyFormId: 732,
  shortFormName: "PHS398_TrainingSubawardBudget_3_0",
  formVersion: "3.0",
  agencyCode: "SGG",
  ombNumber: "0925-0001",
  expirationDate: "2027-12-31",
})
@example(
  #{},
  #{
    title: "No files yet",
    description: "All original source slots are optional. Agency requirements and actual budget-file validation remain separate.",
  }
)
@example(
  #{
    attachments: #[
      "00000000-0000-4000-8000-000000073202",
      "00000000-0000-4000-8000-000000073201"
    ],
  },
  #{
    title: "Two ordered budget references",
    description: "Synthetic attachment IDs illustrate order; no actual upload, template extraction or parsed-budget payload is supplied.",
  }
)
model PHSTrainingSubawardBudget {
  @doc("Attach up to 30 completed PHS 398 Training Budget PDF forms in their original extracted format. Do not re-PDF the form. Use the completed original Training Budget form for each subaward/consortium.")
  @UI.label("Training subaward budget files")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @maxItems(30)
  attachments?: Questions.Types.Attachment[];
}
