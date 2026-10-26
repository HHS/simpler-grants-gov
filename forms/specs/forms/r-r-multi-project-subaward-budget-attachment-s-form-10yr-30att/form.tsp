import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;
namespace Forms.RRMultiProjectSubawardBudget;

@Meta.form(#{
  id: "r-r-multi-project-subaward-budget-attachment-s-form-10yr-30att",
  formName: "R & R Multi-Project Subaward Budget Attachment(s) Form 10YR 30ATT",
})
@GrantsGov.form(#{
  legacyFormId: 789,
  shortFormName: "RR_MP_SubawardBudget_3_0",
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
      "00000000-0000-4000-8000-000000078902",
      "00000000-0000-4000-8000-000000078901"
    ],
  },
  #{
    title: "Two ordered budget references",
    description: "Synthetic attachment IDs illustrate order; no actual upload, template extraction or parsed-budget payload is supplied.",
  }
)
model RRMultiProjectSubawardBudget {
  @doc("Attach up to 30 completed 10 Year R&R Subaward Budget PDF files. Each file name must be unique and use the subawardee organization name.")
  @UI.label("Subaward budget files")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @maxItems(30)
  attachments?: Questions.Types.Attachment[];
}
