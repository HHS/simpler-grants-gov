import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;
namespace Forms.RRSubawardBudgetThirty;

@Meta.form(#{
  id: "r-r-subaward-budget-attachment-s-form-5-yr-30-att",
  formName: "R & R Subaward Budget Attachment(s) Form 5 YR 30 ATT",
})
@GrantsGov.form(#{
  legacyFormId: 782,
  shortFormName: "RR_SubawardBudget30_3_0",
  formVersion: "3.0",
  agencyCode: "SGG",
  ombNumber: "4040-0001",
  expirationDate: "2029-01-31",
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
      "00000000-0000-4000-8000-000000078202",
      "00000000-0000-4000-8000-000000078201"
    ],
  },
  #{
    title: "Two ordered budget references",
    description: "Synthetic attachment IDs illustrate order; no actual upload, template extraction or parsed-budget payload is supplied.",
  }
)
model RRSubawardBudgetThirty {
  @doc("Attach up to 30 completed R&R Subaward Budget PDF files. Each file name must be unique and use the subawardee organization name.")
  @UI.label("Subaward budget files")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @maxItems(30)
  attachments?: Questions.Types.Attachment[];
}
