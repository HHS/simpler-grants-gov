import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/person/title.tsp";
using SimplerForms;
namespace Forms.USDAAD3030;

// The two answers have different meanings; only their source wire vocabulary is shared.
enum YesNo {
  yes: "Y: Yes",
  no: "N: No",
}

@Meta.form(#{ id: "usda-ad-3030", formName: "USDA AD-3030" })
@GrantsGov.form(#{
  legacyFormId: 582,
  shortFormName: "AD_3030",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "0505-0025",
  expirationDate: "2025-09-30",
})
@example(
  #{
    applicantName: "Example Research Corporation",
    applicantAddress: "123 Example Street, Washington, DC 20001",
    taxIdNumber: "0012",
    applicantFelony: YesNo.no,
    unpaidFederalTax: YesNo.no,
    aorSignature: "Jordan Lee",
    title: "President",
    dateSigned: plainDate.fromISO("2026-10-24"),
  },
  #{
    title: "Illustrative completed representation",
    description: "Synthetic applicant and cover/submission values; no legal determination or real signing occurred.",
  }
)
@example(
  #{
    applicantName: "Second Example Corporation",
    applicantAddress: "456 Sample Avenue, Arlington, VA 22201",
    taxIdNumber: "9876",
    applicantFelony: YesNo.yes,
    unpaidFederalTax: YesNo.yes,
    aorSignature: "Morgan Patel",
    title: "Authorized Representative",
    dateSigned: plainDate.fromISO("2026-10-25"),
  },
  #{
    title: "Alternative source answers",
    description: "Exercises both encoded Yes answers without an automated eligibility determination.",
  }
)
model Representations {
  @UI.label("1. APPLICANT'S NAME")
  @doc("Enter the Applicant's Name. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @Meta.role(ResponseRole.applicantInput)
  @minLength(1)
  @maxLength(140)
  applicantName: string;

  @UI.label("2. APPLICANT'S ADDRESS (Including Zip Code)")
  @doc("Enter the Applicant's Address including Zip Code. This field is required.")
  @UI.widget(Rendering.Widget.TextArea)
  @Meta.role(ResponseRole.applicantInput)
  @minLength(1)
  @maxLength(300)
  applicantAddress: string;

  @UI.label("3. TAX ID NO. (Last 4 digits)")
  @doc("Enter the last four digits of the Tax ID Number. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @Meta.role(ResponseRole.applicantInput)
  @minLength(4)
  @maxLength(4)
  @pattern("^[0-9]{4}$")
  taxIdNumber: string;

  @UI.label("4A. Has the Applicant been convicted of a felony criminal violation under any Federal law in the 24 months preceding the date of application?")
  @doc("One selection is required.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  applicantFelony: YesNo;

  @UI.label("4B. Does the Applicant have any unpaid Federal tax liability that has been assessed, for which all judicial and administrative remedies have been exhausted or have lapsed, and that is not being paid in a timely manner pursuant to an agreement with the authority responsible for collecting the tax liability?")
  @doc("One selection is required.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  unpaidFederalTax: YesNo;

  @UI.label("5A. APPLICANT'S SIGNATURE (BY)")
  @doc("Completed by Grants.gov upon submission. This is a required field.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @minLength(1)
  @maxLength(144)
  aorSignature: string;

  @UI.label("5B. TITLE/RELATIONSHIP OF THE INDIVIDUAL IF SIGNING IN A REPRESENTATIVE CAPACITY")
  @doc("Pre-populated from the Application cover sheet. This is a required field.")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  title: Questions.People.PersonTitle;

  @UI.label("5C. DATE SIGNED (MM-DD-YYYY)")
  @doc("Completed by Grants.gov upon submission. This is a required field.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  dateSigned: plainDate;
}
