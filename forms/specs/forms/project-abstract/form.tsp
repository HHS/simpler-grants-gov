import "./examples.tsp";
import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";

using SimplerForms;

namespace Forms.ProjectAbstract;

@Meta.form(#{ id: "project-abstract", formName: "Project Abstract" })
@Sgg.sync(#{
  instructions: "1ea1bd6a-87fc-4d90-ab1e-91bf0b2b4b68",
  xml: "mapping",
})
@GrantsGov.form(#{
  legacyFormId: 541,
  shortFormName: "Project_Abstract_1_2",
  formVersion: "1.2",
  agencyCode: "SGG",
  ombNumber: "4040-0010",
  expirationDate: "2029-08-31",
})
@example(Examples.oneFile, #{ title: "One project abstract file" })
model ProjectAbstract {
  /** A file must be attached. */
  @UI.label("Project Abstract File")
  attachment: Questions.Types.Attachment;
}
