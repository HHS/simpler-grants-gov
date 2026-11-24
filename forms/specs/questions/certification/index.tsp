import "simpler-forms";
import "simpler-forms-sgg";
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

// The SF-424 family's certification: the applicant agrees, and Grants.gov signs and dates
// it on submission. Each form's layout supplies its certification statement.
/** Read the certification statement and check to agree. */
@Meta.question(#{ id: "certification" })
@UI.label("Certification")
model Certification {
  /** Check to select. This field is required. */
  @UI.label("I Agree")
  @UI.widget(Rendering.Widget.Checkbox)
  agree: true;

  /** Completed by Grants.gov upon submission. */
  @UI.label("Signature")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.signature)
  signature?: Questions.Certifications.Signature;

  /** Completed by Grants.gov upon submission. */
  @UI.label("Date Signed")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.postPopulate(Sgg.PostPopulationRule.currentDate)
  dateSigned?: Questions.Certifications.DateSigned;
}
