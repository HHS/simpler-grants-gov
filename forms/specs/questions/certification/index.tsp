import "simpler-forms";
import "#questions/index.tsp";

using SimplerForms;

namespace Questions.Certifications;

/** The signer's name, completed upon submission. */
@Meta.question(#{ id: "certification/signature" })
@UI.label("Signature")
@minLength(1)
@maxLength(144)
scalar Signature extends string;

/** The date signed, completed upon submission. */
@Meta.question(#{ id: "certification/date-signed" })
@UI.label("Date Signed")
scalar DateSigned extends plainDate;
