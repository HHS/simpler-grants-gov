import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;
namespace Forms.EDAbstract;

@doc("Source-reviewed requirements plan using existing library components. Existing implementation comparison and future runtime validation are separately tracked.")
@Meta.form(#{ id: "ed-abstract-form", formName: "ED Abstract Form" })
@GrantsGov.form(#{
  legacyFormId: 267,
  shortFormName: "AbstractAttachments",
  formVersion: "1.1",
  agencyCode: "SGG",
})
@example(
  #{ attachment: "00000000-0000-0000-0000-000000000267" },
  #{
    title: "One abstract attachment",
    description: "Synthetic UUID uses the existing library attachment scalar; this FID has no identified existing SGG implementation. File contents and one-page requirement remain unverified.",
  }
)
model EDAbstract {
  @doc("")
  @UI.label("Attachment")
  attachment: Questions.Types.Attachment;
}
