import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;
namespace Forms.RRFedNonFedSubawardBudget;

@Meta.form(#{
  id: "research-related-subaward-budget-total-fed-non-fed-attachment-s-form",
  formName: "Research & Related Subaward Budget (Total Fed + Non-Fed) Attachment(s) Form",
})
@GrantsGov.form(#{
  legacyFormId: 715,
  shortFormName: "RR_FedNonFed_SubawardBudget_2_0",
  formVersion: "2.0",
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
      "00000000-0000-4000-8000-000000071502",
      "00000000-0000-4000-8000-000000071501"
    ],
  },
  #{
    title: "Two ordered budget references",
    description: "Synthetic attachment IDs illustrate order; no actual upload, template extraction or parsed-budget payload is supplied.",
  }
)
model RRFedNonFedSubawardBudget {
  @doc("Attach up to 10 completed R&R Subaward Budget (Fed/Non-Fed) PDF files. Each file name must be unique and use the subawardee organization name.")
  @UI.label("Subaward budget files")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @maxItems(10)
  attachments?: Questions.Types.Attachment[];
}
