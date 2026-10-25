import "simpler-forms";
import "#forms/index.tsp";
import "#questions/submission/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/title.tsp";
using SimplerForms;
namespace Forms.SF424D;

/** Original D applicant draft. Submission-owned values are optional context, not applicant signing. */
@Meta.form(#{
  id: "assurances-for-construction-programs-sf-424d",
  formName: "ASSURANCES - CONSTRUCTION PROGRAMS",
})
@GrantsGov.form(#{
  legacyFormId: 238,
  shortFormName: "SF424D",
  formVersion: "1.1",
  agencyCode: "SGG",
  ombNumber: "4040-0009",
  expirationDate: "2028-06-30",
})
@example(
  #{
    title: "Executive Director",
    applicantOrganization: "Illustrative D Community Organization",
  },
  #{
    title: "Unsigned applicant draft",
    description: "Editable existing-SGG fallback; no cover copying, signing or submission is performed.",
  }
)
@example(
  #{
    signature: "ILLUSTRATIVE D SUBMISSION CONTEXT",
    title: "Certifying Official D",
    applicantOrganization: "Illustrative D Research Institute",
    dateSigned: plainDate.fromISO("2026-10-25"),
  },
  #{
    title: "Completed illustrative context",
    description: "Synthetic service-owned signature/date, not a signed certification or submitted application.",
  }
)
model SF424D {
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  signature?: Questions.Submission.SubmissionSignature;

  @UI.label("TITLE")
  @doc("Enter the title of the Certifying Official. This field is required.")
  @Meta.role(ResponseRole.applicantInput)
  title: Questions.People.PersonTitle;

  @UI.label("APPLICANT ORGANIZATION")
  @doc("Enter the Applicant Organization. This field is required.")
  @Meta.role(ResponseRole.applicantInput)
  applicantOrganization: Questions.Organizations.OrgName;

  @UI.label("DATE SUBMITTED")
  @doc("Completed on submission to Grants.gov.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  dateSigned?: plainDate;
}
