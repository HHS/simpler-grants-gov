import "simpler-forms";
import "#questions/index.tsp";
using SimplerForms;
namespace Questions.Submission;

// This service-supplied value is not applicant-entered signing or a consent question.
// Readonly ownership remains on the occurrence or enclosing record.
/** Completed on submission to Grants.gov. */
@Meta.question(#{ id: "submission/signature" })
@UI.label("SIGNATURE OF AUTHORIZED CERTIFYING OFFICIAL")
@UI.widget(Rendering.Widget.Text)
@minLength(1)
@maxLength(144)
scalar SubmissionSignature extends string;
