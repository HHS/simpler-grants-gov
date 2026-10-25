import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/person/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/submission/index.tsp";
import "#questions/types/yes-no.tsp";
using SimplerForms;
namespace Forms.FRAF30;

@Meta.form(#{ id: "fra-f-30", formName: "FRA F 30" })
@GrantsGov.form(#{
  legacyFormId: 648,
  shortFormName: "FRA",
  formVersion: "1.0",
  agencyCode: "SGG",
  ombNumber: "2130-0615",
  expirationDate: "2028-01-31",
})
@example(
  #{
    nameAndTitle: "Jordan Lee, Executive Director",
    signature: "ILLUSTRATIVE SUBMISSION CONTEXT",
    dateSigned: plainDate.fromISO("2026-10-25"),
  },
  #{
    title: "Required name and title with illustrative submission context",
    description: "One whole source answer; optional workplace slots and threshold flags are absent.",
  }
)
@example(
  #{
    workplace1: "100 Example Avenue, Denver, CO 80202",
    workplace2: "200 Example Street, Boulder, CO 80301",
    workplace3: "300 Example Road, Aurora, CO 80012",
    workplacesOnFile: Questions.Types.YesNo.yes,
    lobbyingCertificationApplies: Questions.Types.YesNo.no,
    nameAndTitle: "Morgan Patel, Authorized Certifying Official",
    signature: "ILLUSTRATIVE SUBMISSION CONTEXT",
    dateSigned: plainDate.fromISO("2026-10-25"),
  },
  #{
    title: "Three distinct workplace slots and independent flags",
    description: "Descriptions remain whole text in their original source slots; no amount or eligibility is inferred.",
  }
)
model FRAF30Certification {
  @UI.label("Place of Performance 1")
  @doc("Enter line one of three.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(0)
  @maxLength(200)
  @Meta.role(ResponseRole.applicantInput)
  workplace1?: string;

  @UI.label("Place of Performance 2")
  @doc("Enter line two of three.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(0)
  @maxLength(200)
  @Meta.role(ResponseRole.applicantInput)
  workplace2?: string;

  @UI.label("Place of Performance 3")
  @doc("Enter line three of three.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(0)
  @maxLength(200)
  @Meta.role(ResponseRole.applicantInput)
  workplace3?: string;

  @UI.label("Check if there are workplaces on file that are not identified here.")
  @doc("Check if there are workplaces on file that are not identified here.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  workplacesOnFile?: Questions.Types.YesNo;

  @UI.label("Check if the award or loan threshold in Part C applies")
  @doc("Check if applicable certification is for the award of a grant or cooperative agreement exceeding $100,000 or a federal loan exceeding $150,000.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  lobbyingCertificationApplies?: Questions.Types.YesNo;

  @UI.label("SIGNATURE OF AUTHORIZED CERTIFYING OFFICIAL")
  @doc("Completed on submission to Grants.gov.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  signature: Questions.Submission.SubmissionSignature;

  @UI.label("TYPED NAME AND TITLE")
  @doc("Enter the name and title of the official certifying that the certifications in Parts A, B, and C (if C is applicable) are true. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(1)
  @maxLength(200)
  @Meta.role(ResponseRole.applicantInput)
  nameAndTitle: string;

  @UI.label("DATE")
  @doc("Completed on submission to Grants.gov.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  dateSigned: plainDate;
}
