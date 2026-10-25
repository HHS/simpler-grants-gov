import "simpler-forms";
import "#forms/index.tsp";
import "#questions/submission/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/title.tsp";
using SimplerForms;
namespace Forms.SF424B;

/** Original B applicant draft. Submission-owned values are optional context, not applicant signing. */
@Meta.form(#{
  id: "assurances-for-non-construction-programs-sf-424b",
  formName: "ASSURANCES - NON-CONSTRUCTION PROGRAMS",
})
@GrantsGov.form(#{
  legacyFormId: 240,
  shortFormName: "SF424B",
  formVersion: "1.1",
  agencyCode: "SGG",
  ombNumber: "4040-0007",
  expirationDate: "2028-07-31",
})
@example(
  #{
    title: "Executive Director",
    applicantOrganization: "Illustrative B Community Organization",
  },
  #{
    title: "Unsigned applicant draft",
    description: "Editable existing-SGG fallback; no cover copying, signing or submission is performed.",
  }
)
@example(
  #{
    signature: "ILLUSTRATIVE B SUBMISSION CONTEXT",
    title: "Certifying Official B",
    applicantOrganization: "Illustrative B Research Institute",
    dateSigned: plainDate.fromISO("2026-10-25"),
  },
  #{
    title: "Completed illustrative context",
    description: "Synthetic service-owned signature/date, not a signed certification or submitted application.",
  }
)
model SF424B {
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  signature?: Questions.Submission.SubmissionSignature;

  @UI.label("TITLE")
  @doc("Enter the title of the official certifying that the applicant organization will comply with the requirements set forth in this assurance form. This field is required.")
  @Meta.role(ResponseRole.applicantInput)
  title: Questions.People.PersonTitle;

  @UI.label("APPLICANT ORGANIZATION")
  @doc("Enter the name of the applicant organization. This field is required.")
  @Meta.role(ResponseRole.applicantInput)
  applicantOrganization: Questions.Organizations.OrgName;

  @UI.label("DATE SUBMITTED")
  @doc("Completed on submission to Grants.gov.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  dateSigned?: plainDate;
}
