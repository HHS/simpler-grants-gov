import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/person/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/submission/index.tsp";
import "#questions/types/yes-no.tsp";
using SimplerForms;
namespace Forms.HUD50153;

enum HUD50153GeographicCriteria {
  v0: "Within Boundries",
  v1: "Includes Zone",
  v2: "Includes Portion",
  v3: "Delivers Benefits",
}
model HUD50153PromiseZoneOfficial {
  @UI.label("Name")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  name: Questions.People.PersonName;

  @UI.label("Title:")
  @doc("Pre-populated from the SF-424.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  title: Questions.People.PersonTitle;

  @UI.label("Organization:")
  @doc("Pre-populated from the SF-424.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  organizationName: Questions.Organizations.OrgName;
}

@Meta.form(#{ id: "hud-50153", formName: "HUD-50153" })
@GrantsGov.form(#{
  legacyFormId: 844,
  shortFormName: "HUD_50153",
  formVersion: "1.0",
  agencyCode: "SGG",
  ombNumber: "2501-0044",
  expirationDate: "2027-02-28",
})
@example(
  #{
    applicantName: "Illustrative Community Services",
    designatedCommunity: "Illustrative Promise Zone",
    geographicCriteria: HUD50153GeographicCriteria.v0,
    promiseZoneOfficial: #{
      name: #{ firstName: "Jordan", lastName: "Lee" },
      title: "Illustrative Zone Official",
      organizationName: "Illustrative Zone Office",
    },
    signature: "ILLUSTRATIVE SUBMISSION CONTEXT",
    signatureDate: plainDate.fromISO("2026-10-25"),
  },
  #{
    title: "Project solely within the Promise Zone",
    description: "Synthetic supplied official and submission context. No bonus-point eligibility or signing is inferred.",
  }
)
@example(
  #{
    applicantName: "Illustrative Community Services",
    federalProgramNumber: "14.000",
    federalProgramTitle: "Illustrative Program",
    designatedCommunity: "Illustrative Promise Zone",
    geographicCriteria: HUD50153GeographicCriteria.v3,
    promiseZoneOfficial: #{
      name: #{ prefix: "Dr.", firstName: "Morgan", lastName: "Patel" },
      title: "Illustrative Zone Official",
      organizationName: "Illustrative Zone Office",
    },
    signature: "ILLUSTRATIVE SUBMISSION CONTEXT",
    signatureDate: plainDate.fromISO("2026-10-25"),
  },
  #{
    title: "Project outside the boundary delivering benefits within it",
    description: "Retains the exact source criterion and optional program context; no eligibility calculation.",
  }
)
model HUD50153Certification {
  @UI.label("Applicant Name:")
  @doc("Pre-populated from the SF-424.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  applicantName: Questions.Organizations.OrgName;

  @UI.label("Number of the Federal Program to which the applicant is applying:")
  @doc("Pre-populated from the SF-424.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(1)
  @maxLength(15)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  federalProgramNumber?: string;

  @UI.label("Name of the Federal Program to which the applicant is applying:")
  @doc("Pre-populated from the SF-424.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(1)
  @maxLength(120)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  federalProgramTitle?: string;

  @UI.label("Name of the Promise Zone Designated Community:")
  @doc("Enter the name of the Promise Zone Designated Community. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(1)
  @maxLength(200)
  @Meta.role(ResponseRole.applicantInput)
  designatedCommunity: string;

  @UI.label("The proposed project meets the following geographic criteria (please select one):")
  @doc("Select one option from the provided list.\n\nWithin Boundries — The proposed project is solely within Promise Zone boundaries.\n\nIncludes Zone — The proposed project includes the entire Promise Zone boundary and other communities.\n\nIncludes Portion — The proposed project includes a portion of the Promise Zone boundary.\n\nDelivers Benefits — The proposed project is outside of the Promise Zone boundaries, but specific and definable services or benefits will be delivered within the Promise Zone or to Promise Zone residents.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  geographicCriteria: HUD50153GeographicCriteria;

  @UI.label("Promise Zone Official")
  @doc("The PDF identifies a Promise Zone official; the DAT supplies these fields from SF-424. Review this source ownership conflict before production integration.")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  promiseZoneOfficial: HUD50153PromiseZoneOfficial;

  @UI.label("Signature:")
  @doc("Completed on submission to Grants.gov.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  signature: Questions.Submission.SubmissionSignature;

  @UI.label("Date:")
  @doc("Completed on submission to Grants.gov.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  signatureDate: plainDate;
}
