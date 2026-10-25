import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/person/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/submission/index.tsp";
import "#questions/types/yes-no.tsp";
using SimplerForms;
namespace Forms.FNS906;

@Meta.form(#{
  id: "grant-program-accounting-system-financial-capability-questionnaire-fns-906",
  formName: "Grant Program Accounting System & Financial Capability Questionnaire (FNS-906)",
})
@GrantsGov.form(#{
  legacyFormId: 832,
  shortFormName: "FNS_906",
  formVersion: "1.0",
  agencyCode: "SGG",
  ombNumber: "0584-0512",
  expirationDate: "2025-07-31",
})
@example(
  #{
    organizationName: "Illustrative Nutrition Services",
    organizationUei: "EXAMPLE12345",
    federalAward: Questions.Types.YesNo.no,
    accountingSoftware: Questions.Types.YesNo.yes,
    programFunds: Questions.Types.YesNo.yes,
    dedicatedMonitoring: Questions.Types.YesNo.yes,
    separateDuties: Questions.Types.YesNo.yes,
    allocateEffort: Questions.Types.YesNo.yes,
    managementSystem: Questions.Types.YesNo.yes,
    audited: Questions.Types.YesNo.no,
    signature: "ILLUSTRATIVE SUBMISSION CONTEXT",
    signatureDate: plainDate.fromISO("2026-10-25"),
    authorizedRepresentative: #{ firstName: "Jordan", lastName: "Lee" },
    phone: "2025550100",
    email: "contact@example.org",
  },
  #{
    title: "No audit in the last five fiscal years",
    description: "Audit followups are absent and disabled. All context is synthetic.",
  }
)
@example(
  #{
    organizationName: "Illustrative Nutrition Services",
    organizationUei: "EXAMPLE12345",
    federalAward: Questions.Types.YesNo.no,
    accountingSoftware: Questions.Types.YesNo.yes,
    programFunds: Questions.Types.YesNo.yes,
    dedicatedMonitoring: Questions.Types.YesNo.yes,
    separateDuties: Questions.Types.YesNo.yes,
    allocateEffort: Questions.Types.YesNo.yes,
    managementSystem: Questions.Types.YesNo.yes,
    audited: Questions.Types.YesNo.yes,
    signature: "ILLUSTRATIVE SUBMISSION CONTEXT",
    signatureDate: plainDate.fromISO("2026-10-25"),
    authorizedRepresentative: #{ firstName: "Jordan", lastName: "Lee" },
    phone: "2025550100",
    email: "contact@example.org",
    qualifiedOpinion: Questions.Types.YesNo.no,
    materialWeakness: Questions.Types.YesNo.yes,
    significantDeficiency: Questions.Types.YesNo.no,
    hyperlink: "https://example.org/illustrative-audit",
    additionalInformation: "Illustrative audit report issued under the Single Audit Act; no real report is submitted.",
  },
  #{
    title: "Audited organization with three independent followups",
    description: "Audit followups are explicit; the hyperlink is illustrative and does not retrieve or upload a report.",
  }
)
model FNS906Questionnaire {
  @UI.label("Legal Organization Name:")
  @doc("Pre-populated from the SF-424.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  organizationName: Questions.Organizations.OrgName;

  @UI.label("UEI Number:")
  @doc("Pre-populated from the SF-424.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  organizationUei: Questions.Organizations.OrgUei;

  @UI.label("1.  Has your organization received a Federal award within the past 3 years?")
  @doc("Has your organization received a Federal award within the past 3 years? This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  federalAward: Questions.Types.YesNo;

  @UI.label("2.  Does your organization utilize accounting software to manage your financial records?")
  @doc("Does your organization utilize accounting software to manage your financial records? This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  accountingSoftware: Questions.Types.YesNo;

  @UI.label("3.  Does your accounting system identify the receipt and expenditure of program funds separately for each grant?")
  @doc("Does your accounting system identify the receipt and expenditure of program funds separately for each grant? This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  programFunds: Questions.Types.YesNo;

  @UI.label("4.  Does your organization have a dedicated individual responsible for monitoring organizational funds, such as an accountant or a finance manager?")
  @doc("Does your organization have a dedicated individual responsible for monitoring organizational funds, such as an accountant or a finance manager? This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  dedicatedMonitoring: Questions.Types.YesNo;

  @UI.label("5.  Does your organization separate the duties for staff handling the approval of transactions and the recording and payment of funds?")
  @doc("Does your organization separate the duties for staff handling the approval of transactions and the recording and payment of funds? This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  separateDuties: Questions.Types.YesNo;

  @UI.label("6.  Does your organization have the ability to specifically identify and allocate employee effort to an applicable program?")
  @doc("Does your organization have the ability to specifically identify and allocate employee effort to an applicable program? This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  allocateEffort: Questions.Types.YesNo;

  @UI.label("7.  Does your organization have a property/inventory management system in place to track location and value of equipment purchased under the award?")
  @doc("Does your organization have a property/inventory management system in place to track location and value of equipment purchased under the award? This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  managementSystem: Questions.Types.YesNo;

  @UI.label("1.  Has your organization been audited within the last 5 fiscal years? (If the answer is “Yes” and this report was issued under the Single Audit Act please note this in the box below marked “Additional Information” and if not issued under the “Single Audit Act”, please provide a link to the audit report in the Hyperlink space below, or attach a copy to your application’s ATTACHMENTS FORM).")
  @doc("Has your organization been audited within the last 5 fiscal years? (If the answer is “Yes” and this report was issued under the Single Audit Act please note this in the box below marked “Additional Information” and if not issued under the “Single Audit Act”, please provide a link to the audit report in the Hyperlink space below, or attach a copy to your application’s ATTACHMENTS FORM). This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  audited: Questions.Types.YesNo;

  @UI.label("2.  If your organization has been audited within the last 5 fiscal years, was there a “Qualified Opinion” or an “Adverse Opinion”?")
  @doc("If your organization has been audited within the last 5 fiscal years, was there a “Qualified Opinion” or an “Adverse Opinion”? This field is required when Audited is Yes.")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhen(FNS906Questionnaire.audited, Questions.Types.YesNo.yes)
  @Validation.requiredWhen(
    FNS906Questionnaire.audited,
    Questions.Types.YesNo.yes
  )
  @Meta.role(ResponseRole.applicantInput)
  qualifiedOpinion?: Questions.Types.YesNo;

  @UI.label("3.  If your organization has been audited within the last 5 fiscal years, was there a “Material Weakness” disclosed?")
  @doc("If your organization has been audited within the last 5 fiscal years, was there a “Material Weakness” disclosed? This field is required when Audited is Yes.")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhen(FNS906Questionnaire.audited, Questions.Types.YesNo.yes)
  @Validation.requiredWhen(
    FNS906Questionnaire.audited,
    Questions.Types.YesNo.yes
  )
  @Meta.role(ResponseRole.applicantInput)
  materialWeakness?: Questions.Types.YesNo;

  @UI.label("4.  If your organization has been audited within the last 5 fiscal years, was there a “Significant Deficiency” disclosed?")
  @doc("If your organization has been audited within the last 5 fiscal years, was there a “Significant Deficiency” disclosed? This field is required when Audited is Yes.")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhen(FNS906Questionnaire.audited, Questions.Types.YesNo.yes)
  @Validation.requiredWhen(
    FNS906Questionnaire.audited,
    Questions.Types.YesNo.yes
  )
  @Meta.role(ResponseRole.applicantInput)
  significantDeficiency?: Questions.Types.YesNo;

  @UI.label("Hyperlink (if available):")
  @doc("Provide Hyperlink (if available).")
  @UI.widget(Rendering.Widget.Text)
  @minLength(1)
  @maxLength(200)
  @Meta.role(ResponseRole.applicantInput)
  hyperlink?: string;

  @UI.label("Additional information including expanding on responses in previous sections:")
  @doc("Additional information including expanding on responses in previous sections.")
  @UI.widget(Rendering.Widget.TextArea)
  @minLength(1)
  @maxLength(3000)
  @Meta.role(ResponseRole.applicantInput)
  additionalInformation?: string;

  @UI.label("Authorized Representative's Signature:")
  @doc("Completed by Grants.gov upon submission.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  signature: Questions.Submission.SubmissionSignature;

  @UI.label("Date:")
  @doc("Completed by Grants.gov upon submission.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  signatureDate: plainDate;

  @UI.label("Authorized Representative")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  authorizedRepresentative: Questions.People.PersonName;

  @UI.label("Phone:")
  @doc("Pre-populated from the SF-424.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  phone: Questions.People.PersonPhoneNumber;

  @UI.label("Email:")
  @doc("Pre-populated from the SF-424.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  email: Questions.People.PersonEmail;
}
