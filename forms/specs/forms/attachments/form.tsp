import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;
namespace Forms.ApplicationAttachments;

@Meta.form(#{ id: "attachments", formName: "Attachments" })
@GrantsGov.form(#{
  legacyFormId: 540,
  shortFormName: "AttachmentForm_1_2",
  formVersion: "1.2",
  agencyCode: "SGG",
})
@example(
  #{},
  #{
    title: "No attachments yet",
    description: "All fifteen source slots are optional. Agency instructions may impose additional requirements.",
  }
)
@example(
  #{
    att1: "00000000-0000-0000-0000-000000000002",
    att15: "00000000-0000-0000-0000-000000000010",
  },
  #{
    title: "Two named slots",
    description: "Illustrative UUIDs retain slot identity. These are not uploaded files and will not resolve in the attachment service.",
  }
)
@example(
  #{
    att1: "00000000-0000-0000-0000-000000000002",
    att2: "00000000-0000-0000-0000-000000000003",
    att3: "00000000-0000-0000-0000-000000000004",
    att4: "00000000-0000-0000-0000-000000000005",
    att5: "00000000-0000-0000-0000-000000000006",
    att6: "00000000-0000-0000-0000-000000000007",
    att7: "00000000-0000-0000-0000-000000000008",
    att8: "00000000-0000-0000-0000-000000000009",
    att9: "00000000-0000-0000-0000-00000000000a",
    att10: "00000000-0000-0000-0000-00000000000b",
    att11: "00000000-0000-0000-0000-00000000000c",
    att12: "00000000-0000-0000-0000-00000000000d",
    att13: "00000000-0000-0000-0000-00000000000e",
    att14: "00000000-0000-0000-0000-00000000000f",
    att15: "00000000-0000-0000-0000-000000000010",
  },
  #{
    title: "All fifteen slots",
    description: "Upper slot boundary; synthetic attachment IDs preserve the existing SGG contract.",
  }
)
model ApplicationAttachments {
  @doc("Click to add this attachment.")
  @UI.label("1) Please attach Attachment 1")
  att1?: Questions.Types.Attachment;

  @doc("Click to add this attachment.")
  @UI.label("2) Please attach Attachment 2")
  att2?: Questions.Types.Attachment;

  @doc("Click to add this attachment.")
  @UI.label("3) Please attach Attachment 3")
  att3?: Questions.Types.Attachment;

  @doc("Click to add this attachment.")
  @UI.label("4) Please attach Attachment 4")
  att4?: Questions.Types.Attachment;

  @doc("Click to add this attachment.")
  @UI.label("5) Please attach Attachment 5")
  att5?: Questions.Types.Attachment;

  @doc("Click to add this attachment.")
  @UI.label("6) Please attach Attachment 6")
  att6?: Questions.Types.Attachment;

  @doc("Click to add this attachment.")
  @UI.label("7) Please attach Attachment 7")
  att7?: Questions.Types.Attachment;

  @doc("Click to add this attachment.")
  @UI.label("8) Please attach Attachment 8")
  att8?: Questions.Types.Attachment;

  @doc("Click to add this attachment.")
  @UI.label("9) Please attach Attachment 9")
  att9?: Questions.Types.Attachment;

  @doc("Click to add this attachment.")
  @UI.label("10) Please attach Attachment 10")
  att10?: Questions.Types.Attachment;

  @doc("Click to add this attachment.")
  @UI.label("11) Please attach Attachment 11")
  att11?: Questions.Types.Attachment;

  @doc("Click to add this attachment.")
  @UI.label("12) Please attach Attachment 12")
  att12?: Questions.Types.Attachment;

  @doc("Click to add this attachment.")
  @UI.label("13) Please attach Attachment 13")
  att13?: Questions.Types.Attachment;

  @doc("Click to add this attachment.")
  @UI.label("14) Please attach Attachment 14")
  att14?: Questions.Types.Attachment;

  @doc("Click to add this attachment.")
  @UI.label("15) Please attach Attachment 15")
  att15?: Questions.Types.Attachment;
}
