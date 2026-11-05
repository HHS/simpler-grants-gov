import "./examples.tsp";
import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
using SimplerForms;
namespace Forms.NSFDeviationAuthorization;

@Meta.form(#{
  id: "nsf-deviation-authorization",
  formName: "NSF Deviation Authorization",
})
@GrantsGov.form(#{
  legacyFormId: 306,
  shortFormName: "NSF_DeviationAuthorization",
  formVersion: "1.1",
  agencyCode: "SGG",
  ombNumber: "3145-0058",
  expirationDate: "2026-11-30",
})
@example(Examples.sample1, #{ title: "No optional information" })
@example(Examples.sample2, #{ title: "Illustrative complete response" })
model NSFDeviationAuthorization {
  @UI.label("Deviation authorization information")
  @doc("Type the Deviation Authorization information in this box (if applicable).")
  @minLength(1)
  @maxLength(4000)
  @UI.widget(Rendering.Widget.TextArea)
  @Meta.role(ResponseRole.applicantInput)
  deviationAuthorization?: string;
}
