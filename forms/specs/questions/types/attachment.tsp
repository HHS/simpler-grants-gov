import "simpler-forms";

import "#questions/index.tsp";

using SimplerForms;

namespace Questions.Types;

// `att:AttachedFileDataType`. The response holds the uploaded file's id; its name, type,
// location and hash are written from the upload when the XML is built.
/** Attach a file. */
@Meta.question(#{ id: "types/attachment" })
@Meta.tag(Catalogue.Tag.attachment)
@UI.label("Attachment")
@UI.widget(Rendering.Widget.Attachment)
@format("uuid")
scalar Attachment extends string;
