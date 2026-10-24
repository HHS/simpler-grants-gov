import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;
namespace Forms.ProjectAbstract;

@Meta.form(#{ id: "project-abstract", formName: "Project Abstract" })
@GrantsGov.form(#{
  legacyFormId: 541,
  shortFormName: "Project_Abstract_1_2",
  formVersion: "1.2",
  agencyCode: "SGG",
  ombNumber: "4040-0010",
  expirationDate: "2029-08-31",
})
@example(
  #{ attachment: "00000000-0000-0000-0000-000000000002" },
  #{
    title: "One project abstract file",
    description: "Synthetic uploaded-file ID only. The file itself must be no more than one page and contain no proprietary/confidential information; those facts cannot be checked from a UUID.",
  }
)
model ProjectAbstract {
  @doc("Attach a file using the appropriate buttons. This attachment is required.")
  @UI.label("Please click the add attachment button to complete this entry.")
  attachment: Questions.Types.Attachment;
}
