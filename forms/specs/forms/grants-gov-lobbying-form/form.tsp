import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/name.tsp";
import "#questions/person/title.tsp";
import "#questions/submission/index.tsp";
using SimplerForms;
namespace Forms.GGLobbyingForm;

/** Existing SGG electronic draft; applicant answers stay distinct from service-owned completion. */
@Meta.form(#{
  id: "grants-gov-lobbying-form",
  formName: "CERTIFICATION REGARDING LOBBYING",
})
@GrantsGov.form(#{
  legacyFormId: 255,
  shortFormName: "GG_LobbyingForm",
  formVersion: "1.1",
  agencyCode: "SGG",
  ombNumber: "4040-0013",
  expirationDate: "2028-06-30",
})
@example(
  #{
    organizationName: "Illustrative Harbor Research",
    authorizedRepresentativeName: #{ firstName: "Elena", lastName: "North" },
    authorizedRepresentativeTitle: "Program Director",
  },
  #{
    title: "Unsigned applicant draft",
    description: "Editable existing-SGG fallback; no cover copying, signing or submission is performed.",
  }
)
@example(
  #{
    organizationName: "Illustrative River Institute",
    authorizedRepresentativeName: #{
      prefix: "Dr.",
      firstName: "Morgan",
      middleName: "Quinn",
      lastName: "Lake",
      suffix: "III",
    },
    authorizedRepresentativeTitle: "Executive Director",
    authorizedRepresentativeSignature: "ILLUSTRATIVE LOBBYING SUBMISSION CONTEXT",
    submittedDate: plainDate.fromISO("2026-10-25"),
  },
  #{
    title: "Completed illustrative context",
    description: "Distinct synthetic name/title/signature values; the service-owned context is not an actual signed certification or submitted application.",
  }
)
model GGLobbyingForm {
  @UI.label("APPLICANT'S ORGANIZATION")
  @Meta.role(ResponseRole.applicantInput)
  organizationName: Questions.Organizations.OrgName;

  @UI.label("Authorized Representative Name")
  @Meta.role(ResponseRole.applicantInput)
  authorizedRepresentativeName: Questions.People.PersonName;

  @UI.label("Title")
  @Meta.role(ResponseRole.applicantInput)
  authorizedRepresentativeTitle: Questions.People.PersonTitle;

  @UI.label("SIGNATURE")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  authorizedRepresentativeSignature?: Questions.Submission.SubmissionSignature;

  @doc("Completed on submission to Grants.gov.")
  @UI.label("DATE")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  submittedDate?: plainDate;
}
