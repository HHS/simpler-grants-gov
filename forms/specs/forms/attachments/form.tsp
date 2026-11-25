import "./examples.tsp";
import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;
namespace Forms.ApplicationAttachments;

@Meta.form(#{ id: "attachments", formName: "Attachments" })
@Sgg.sync(#{ xml: "mapping" })
@GrantsGov.form(#{
  legacyFormId: 540,
  shortFormName: "AttachmentForm_1_2",
  formVersion: "1.2",
  agencyCode: "SGG",
})
@example(
  Examples.empty,
  #{
    title: "No attachments yet",
    description: "All fifteen source slots are optional. Agency instructions may impose additional requirements.",
  }
)
@example(
  Examples.firstAndLast,
  #{
    title: "Two named slots",
    description: "Illustrative UUIDs retain slot identity. These are not uploaded files and will not resolve in the attachment service.",
  }
)
@example(
  Examples.allSlots,
  #{
    title: "All fifteen slots",
    description: "Upper slot boundary; synthetic attachment IDs preserve the existing SGG contract.",
  }
)
model ApplicationAttachments {
  /** Click to add this attachment. */
  @UI.label("1) Please attach Attachment 1")
  att1?: Questions.Types.Attachment;

  /** Click to add this attachment. */
  @UI.label("2) Please attach Attachment 2")
  att2?: Questions.Types.Attachment;

  /** Click to add this attachment. */
  @UI.label("3) Please attach Attachment 3")
  att3?: Questions.Types.Attachment;

  /** Click to add this attachment. */
  @UI.label("4) Please attach Attachment 4")
  att4?: Questions.Types.Attachment;

  /** Click to add this attachment. */
  @UI.label("5) Please attach Attachment 5")
  att5?: Questions.Types.Attachment;

  /** Click to add this attachment. */
  @UI.label("6) Please attach Attachment 6")
  att6?: Questions.Types.Attachment;

  /** Click to add this attachment. */
  @UI.label("7) Please attach Attachment 7")
  att7?: Questions.Types.Attachment;

  /** Click to add this attachment. */
  @UI.label("8) Please attach Attachment 8")
  att8?: Questions.Types.Attachment;

  /** Click to add this attachment. */
  @UI.label("9) Please attach Attachment 9")
  att9?: Questions.Types.Attachment;

  /** Click to add this attachment. */
  @UI.label("10) Please attach Attachment 10")
  att10?: Questions.Types.Attachment;

  /** Click to add this attachment. */
  @UI.label("11) Please attach Attachment 11")
  att11?: Questions.Types.Attachment;

  /** Click to add this attachment. */
  @UI.label("12) Please attach Attachment 12")
  att12?: Questions.Types.Attachment;

  /** Click to add this attachment. */
  @UI.label("13) Please attach Attachment 13")
  att13?: Questions.Types.Attachment;

  /** Click to add this attachment. */
  @UI.label("14) Please attach Attachment 14")
  att14?: Questions.Types.Attachment;

  /** Click to add this attachment. */
  @UI.label("15) Please attach Attachment 15")
  att15?: Questions.Types.Attachment;
}
