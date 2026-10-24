import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/name.tsp";
import "#questions/person/title.tsp";
using SimplerForms;
namespace Forms.USDAAD1047;

/** Certification completion includes explicit cover and submission context, not a local signing service. */
@Meta.form(#{ id: "usda-ad-1047", formName: "USDA AD-1047" })
@GrantsGov.form(#{
  legacyFormId: 545,
  shortFormName: "AD_1047",
  formVersion: "1.0",
  agencyCode: "SGG",
  ombNumber: "0505-0027",
  expirationDate: "2025-09-30",
})
@example(
  #{
    organizationName: "Example Research Institute",
    projectName: "Illustrative research project",
    authorizedRepresentative: #{ firstName: "Jordan", lastName: "Lee" },
    title: "Executive Director",
    aorSignature: "Jordan Lee",
    dateSigned: plainDate.fromISO("2026-10-24"),
  },
  #{
    title: "Completed context with required name parts",
    description: "Synthetic cover and submission values; no real signing or submission occurred.",
  }
)
@example(
  #{
    organizationName: "Example Community Organization",
    projectName: "Illustrative community project",
    authorizedRepresentative: #{
      prefix: "Dr.",
      firstName: "Morgan",
      middleName: "Alex",
      lastName: "Patel",
      suffix: "Jr.",
    },
    title: "Authorized Representative",
    aorSignature: "Morgan Alex Patel",
    dateSigned: plainDate.fromISO("2026-10-25"),
  },
  #{
    title: "Completed context with all name parts",
    description: "Distinct illustrative values exercise every source field and optional name part.",
  }
)
model Certification {
  @doc("Pre-populated from the Application cover sheet. This field is required.")
  @UI.label("ORGANIZATION NAME")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  organizationName: Questions.Organizations.OrgName;

  @doc("Enter the PR/Award Number or Project Name. This field is required.")
  @UI.label("PR/AWARD NUMBER OR PROJECT NAME")
  @UI.widget(Rendering.Widget.Text)
  @Meta.role(ResponseRole.applicantInput)
  @minLength(1)
  @maxLength(60)
  projectName: string;

  @doc("Pre-populated from the Application cover sheet. First and last name are required.")
  @UI.label("Authorized Representative Name")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  authorizedRepresentative: Questions.People.PersonName;

  @doc("Pre-populated from the Application cover sheet. This field is required.")
  @UI.label("Title")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  title: Questions.People.PersonTitle;

  @doc("Completed by Grants.gov upon submission. This field is required.")
  @UI.label("SIGNATURE(S)")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @minLength(1)
  @maxLength(144)
  aorSignature: string;

  @doc("Completed by Grants.gov upon submission. This field is required.")
  @UI.label("DATE")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  dateSigned: plainDate;
}
