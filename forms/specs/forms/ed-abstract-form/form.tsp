import "./examples.tsp";
import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";

using SimplerForms;

namespace Forms.EDAbstract;

@Meta.form(#{ id: "ed-abstract-form", formName: "ED Abstract Form" })
@Sgg.sync(#{
  instructions: "f20fa839-063a-4fdb-8a21-480f338e0055",
  xml: "mapping",
})
@GrantsGov.form(#{
  legacyFormId: 267,
  shortFormName: "AbstractAttachments",
  formVersion: "1.1",
  agencyCode: "SGG",
})
@example(Examples.oneFile, #{ title: "One abstract attachment" })
model EDAbstract {
  // Blank out the bank Attachment help: the layout shows the abstract instructions instead.
  // An empty doc comment emits nothing, so this needs `@doc("")`.
  @doc("")
  attachment: Questions.Types.Attachment;
}
