import "simpler-forms";
import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/title.tsp";
import "#questions/submission/index.tsp";
import "#questions/types/address.tsp";
import "#questions/types/codes.tsp";
import "#questions/types/contact-info.tsp";
using SimplerForms;
namespace Forms.EPA47004;

// This is the existing SGG applicant profile. Original supplied-empty and transmitted
// signature/date differences are declared beside the plan, not adopted as new source policy.
@Meta.form(#{
  id: "epa-form-4700-4",
  formName: "Preaward Compliance Review Report for All Applicants and Recipients Requesting EPA Financial Assistance",
})
@GrantsGov.form(#{
  legacyFormId: 773,
  shortFormName: "EPA4700_4",
  formVersion: "5.0",
  agencyCode: "SGG",
  ombNumber: "2030-0020",
  expirationDate: "2029-02-28",
})
@example(
  #{
    applicantName: "Joe's Research Place",
    applicantAddress: #{
      address: "123 Main St",
      city: "Exampleburg",
      state: Questions.Types.StateCode.NY,
      zipCode: "12345-6789",
    },
    samUei: "EPA123456789",
    pointOfContactName: "Whole POC Name Example",
    pointOfContactPhoneNumber: "(123) 456-7890",
    pointOfContactEmail: "example@example.com",
    pointOfContactTitle: "POC Director",
    applicantSignature: #{ aorTitle: "Authorized Official Director" },
  },
  #{
    title: "Unsigned applicant draft with illustrative application context",
    description: "Synthetic application-supplied UEI is present; this preview does not fetch cover data, sign or submit.",
  }
)
@example(
  #{
    applicantName: "APPLICANT ORGANIZATION DISTINCT",
    applicantAddress: #{
      address: "DOMESTIC ADDRESS DISTINCT",
      city: "Applicant City",
      state: Questions.Types.StateCode.NY,
      zipCode: "10001-1234",
    },
    samUei: "EPA123456789",
    pointOfContactName: "WHOLE POC NAME DISTINCT",
    pointOfContactPhoneNumber: "2025550191",
    pointOfContactEmail: "poc-distinct@example.org",
    pointOfContactTitle: "POC TITLE DISTINCT",
    federalFinancialAssistance: false,
    civilRightsLawsuitQuestion1: "PENDING LAWSUITS DISTINCT",
    civilRightsLawsuitQuestion2: "DECIDED LAST YEAR DISTINCT",
    civilRightsLawsuitQuestion3: "COMPLIANCE REVIEWS TWO YEARS DISTINCT",
    constructionFederalAssistance: true,
    constructionNewFacilities: false,
    constructionNewFacilitiesExplanation: "ACCESSIBILITY EXCEPTION DISTINCT",
    notice1: true,
    notice2: false,
    notice3: true,
    notice4: false,
    demographicData: true,
    policy: false,
    policyExplanation: "COORDINATOR CONTACT DISTINCT",
    programExplanation: "GRIEVANCE PROCEDURES DISTINCT",
    applicantSignature: #{
      aorSignature: "SYNTHETIC SUBMISSION SIGNATURE DISTINCT",
      aorTitle: "AUTHORIZED OFFICIAL TITLE DISTINCT",
      submittedDate: plainDate.fromISO("2026-10-25"),
    },
  },
  #{
    title: "Distinct completed illustrative context",
    description: "Mixed independent booleans and distinct contact/title/narrative answers; signature/date are synthetic submission context, not a signed certification.",
  }
)
model EPA47004 {
  @UI.label("Name:")
  @doc("Enter the legal name of the applicant that will undertake the assistance activity. This field is required.")
  @Meta.role(ResponseRole.applicantInput)
  applicantName: Questions.Organizations.OrgName;

  @UI.label("Applicant address")
  @Meta.role(ResponseRole.applicantInput)
  applicantAddress: DomesticApplicantAddress;

  @UI.label("B.  Unique Entity Identifier (UEI):")
  @doc("Supplied by the application context. Illustrative examples provide a synthetic UEI; this preview does not fetch or copy cover-sheet data.")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  samUei: Questions.Organizations.OrgUei;

  @UI.label("Name:")
  @doc("Enter the Applicant/Recipient Point of Contact Name. This field is required.")
  @Meta.role(ResponseRole.applicantInput)
  @minLength(1)
  @maxLength(100)
  pointOfContactName: string;

  @UI.label("Phone:")
  @doc("Enter the Telephone Number. This field is required.")
  @Meta.role(ResponseRole.applicantInput)
  pointOfContactPhoneNumber: Questions.Types.PhoneNumber;

  @UI.label("Email:")
  @doc("Enter a valid Email Address. This field is required.")
  @Meta.role(ResponseRole.applicantInput)
  pointOfContactEmail: Questions.Types.EmailAddress;

  @UI.label("Title:")
  @doc("Enter the position title. This field is required.")
  @Meta.role(ResponseRole.applicantInput)
  pointOfContactTitle: Questions.People.PersonTitle;

  @UI.label("II.  Is the applicant currently receiving EPA Assistance?")
  @Meta.role(ResponseRole.applicantInput)
  @UI.widget(Rendering.Widget.Radio)
  federalFinancialAssistance?: boolean;

  @UI.label("III. List all pending civil rights lawsuits and administrative complaints filed under federal law against the applicant/recipient that allege discrimination based on race, color, national origin, sex, age, or disability. (Do not include employment complaints not covered by 40 C.F.R. Parts 5 and 7.)")
  @doc("List all pending civil rights lawsuits and administrative complaints filed under federal law against the applicant/recipient that allege discrimination based on race, color, national origin, sex, age, or disability. (Do not include employment complaints not  covered by 40 C.F.R. Parts 5 and 7.)\n\"Civil rights lawsuits and administrative complaints\" means any pending lawsuit or complaint alleging discrimination on the basis of race, color, national origin, sex, age, or disability filed under federal law against the applicant and/or entity which actually benefits from the grant.  For example, if a city is the named applicant but the grant will actually benefit the Department of Sewage, civil rights lawsuits involving both the city and the Department of Sewage should be listed.  ")
  @Meta.role(ResponseRole.applicantInput)
  @UI.widget(Rendering.Widget.TextArea)
  civilRightsLawsuitQuestion1?: CivilRightsNarrative;

  @UI.label("IV. List all civil rights lawsuits and administrative complaints decided against the applicant/recipient within the last year that alleged discrimination based on race, color, national origin, sex, age, or disability and enclose a copy of all decisions.  Please describe all corrective actions taken.  (Do not include employment complaints not covered by 40 C.F.R. Parts 5 and 7.)")
  @doc("List all civil rights lawsuits and administrative complaints decided against the applicant/recipient within the last year that alleged discrimination based on race, color, national origin, sex, age, or disability and enclose a copy of all decisions.  Please describe all corrective actions taken.  (Do not include employment complaints not covered by 40 C.F.R. Parts 5 and 7.)\n\"Civil rights lawsuits and administrative complaints\" means any lawsuit or complaint decided against the applicant/recipient within the last year that alleged discrimination on the basis of race, color, national origin, sex, age or disability against the applicant and/or entity which actually benefits from the grant.  For example, if a city is the named applicant but the grant will actually benefit the Department of Sewage, civil rights lawsuits involving both the city and the Department of Sewage should be listed.  ")
  @Meta.role(ResponseRole.applicantInput)
  @UI.widget(Rendering.Widget.TextArea)
  civilRightsLawsuitQuestion2?: CivilRightsNarrative;

  @UI.label("V.  List all civil rights compliance reviews of the applicant/recipient conducted under federal nondiscrimination laws by any federal agency within the last two years and enclose a copy of the review and any decisions, orders, or agreements based on the review. Please describe any corrective action taken. (40 C.F.R. § 7.80(c)(3))")
  @doc("List all civil rights compliance reviews of the applicant/recipient conducted under federal nondiscrimination laws by any federal agency within the last two years and enclose a copy of the review and any decisions, orders, or agreements based on the review. Please describe any corrective action taken. (40 C.F.R. § 7.80(c)(3)). \n\"Civil rights compliance review\" means any review assessing the applicant's and/or recipient's compliance with laws prohibiting discrimination on the basis of race, color, national origin, sex, age, or disability.")
  @Meta.role(ResponseRole.applicantInput)
  @UI.widget(Rendering.Widget.TextArea)
  civilRightsLawsuitQuestion3?: CivilRightsNarrative;

  @UI.label("VI.  Is the applicant requesting EPA assistance for new construction?  If no, proceed to VII; if yes, answer (a) and/or (b) below.")
  @Meta.role(ResponseRole.applicantInput)
  @UI.widget(Rendering.Widget.Radio)
  constructionFederalAssistance?: boolean;

  @UI.label("a.  If the grant is for new construction, will all new facilities or alterations to existing facilities be designed and constructed to be readily accessible to and usable by persons with disabilities?  If yes, proceed to VII; if no, proceed to VI(b).")
  @Meta.role(ResponseRole.applicantInput)
  @UI.widget(Rendering.Widget.Radio)
  constructionNewFacilities?: boolean;

  @UI.label("b.  If the grant is for new construction and the new facilities or alterations to existing facilities will not be readily accessible to and usable by persons with disabilities, explain how a regulatory exception (40 C.F.R. 7.70) applies.")
  @doc("If the grant is for new construction and the new facilities or alterations to existing facilities will not be readily accessible to and usable by persons with disabilities, explain how a regulatory exception (40 C.F.R. 7.70) applies.")
  @Meta.role(ResponseRole.applicantInput)
  @minLength(1)
  @maxLength(500)
  @UI.widget(Rendering.Widget.TextArea)
  constructionNewFacilitiesExplanation?: string;

  @UI.label("VII.   Does the applicant/recipient provide initial and continuing notice that it does not discriminate on the basis of race, color, national origin, sex, age, or disability in its program or activities?  (40 C.F.R 5.140 and 7.95)")
  @Meta.role(ResponseRole.applicantInput)
  @UI.widget(Rendering.Widget.Radio)
  notice1?: boolean;

  @UI.label("a.  Do the methods of notice accommodate those with impaired vision or hearing?")
  @Meta.role(ResponseRole.applicantInput)
  @UI.widget(Rendering.Widget.Radio)
  notice2?: boolean;

  @UI.label("b. Is the notice posted in a prominent place in the applicant's/recipient’s website, in the offices or facilities or, for education programs and activities, in appropriate periodicals and other written communications?")
  @Meta.role(ResponseRole.applicantInput)
  @UI.widget(Rendering.Widget.Radio)
  notice3?: boolean;

  @UI.label("c.  Does the notice identify a designated civil rights coordinator?")
  @Meta.role(ResponseRole.applicantInput)
  @UI.widget(Rendering.Widget.Radio)
  notice4?: boolean;

  @UI.label("VIII.   Does the applicant/recipient maintain demographic data on the race, color, national origin, sex, age, or disability status of the population it serves?  (40 C.F.R. 7.85(a))")
  @Meta.role(ResponseRole.applicantInput)
  @UI.widget(Rendering.Widget.Radio)
  demographicData?: boolean;

  @UI.label("IX.   Does the applicant/recipient have a policy/procedure for providing meaningful access to services for persons with limited English proficiency?  (Title VI, 40 C.F.R. Part 7, Lau v Nichols 414 U.S. (1974))")
  @Meta.role(ResponseRole.applicantInput)
  @UI.widget(Rendering.Widget.Radio)
  policy?: boolean;

  @UI.label("X.   If the applicant is an education program or activity, or has 15 or more employees, has it designated an employee to coordinate its compliance with 40 C.F.R. Parts 5 and 7?  Provide the name, title, position, mailing address, e-mail address, fax number, and telephone number of the designated coordinator.")
  @doc("If the applicant is an education program or activity, or has 15 or more employees, has it designated an employee to coordinate its compliance with 40 C.F.R. Parts 5 and 7?  Provide the name, title, position, mailing address, e-mail address, fax number, and telephone number of the designated coordinator.")
  @Meta.role(ResponseRole.applicantInput)
  @minLength(1)
  @maxLength(1000)
  @UI.widget(Rendering.Widget.TextArea)
  policyExplanation?: string;

  @UI.label("XI.   If the applicant is an education program or activity, or has 15 or more employees, has it adopted grievance procedures that assure the prompt and fair resolution of complaints that allege a violation of 40 C.F.R. Parts 5 and 7?  Provide a legal citation or applicant’s/recipient’s website address for, or a copy of, the procedures.")
  @doc("If the applicant is an education program or activity, or has 15 or more employees, has it adopted grievance procedures that assure the prompt and fair resolution of complaints that allege a violation of 40 C.F.R. Parts 5 and 7?  Provide a legal citation or applicant’s/recipient’s website address for, or a copy of, the procedures.")
  @Meta.role(ResponseRole.applicantInput)
  @minLength(1)
  @maxLength(1000)
  @UI.widget(Rendering.Widget.TextArea)
  programExplanation?: string;

  @UI.label("Applicant certification")
  applicantSignature: ApplicantSignature;
}

// Constraint reuse within this form does not merge these three distinct legal questions.
@minLength(1)
@maxLength(4000)
scalar CivilRightsNarrative extends string;

// Original source-specific four-field address. Generic Address has different answers and bounds.
model DomesticApplicantAddress {
  @UI.label("Address:")
  @doc("Enter the address. This field is required.")
  @minLength(1)
  @maxLength(110)
  @UI.widget(Rendering.Widget.TextArea)
  address: string;

  @UI.label("City:")
  @doc("Enter the City. This field is required.")
  city: Questions.Types.AddressParts.City;

  @UI.label("State:")
  @doc("Select the state, US possession or military code from the provided list. This field is required.")
  state: Questions.Types.StateCode;

  @UI.label("Zip Code:")
  @doc("Enter the Postal Code (e.g., ZIP code). This field is required.")
  zipCode: Questions.Types.AddressParts.ZipCode;
}

model ApplicantSignature {
  @UI.label("A. Signature of Authorized Official")
  @doc("Completed by Grants.gov upon submission. This is a required field.")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @UI.widget(Rendering.Widget.Text)
  aorSignature?: Questions.Submission.SubmissionSignature;

  @UI.label("B. Title of Authorized Official")
  @doc("Enter the title of the Authorized Official. This field is required and remains editable; this preview does not copy it from a cover sheet.")
  @Meta.role(ResponseRole.applicantInput)
  aorTitle: Questions.People.PersonTitle;

  @UI.label("C. Date")
  @doc("Completed by Grants.gov upon submission. This is a required field.")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @UI.widget(Rendering.Widget.Text)
  submittedDate?: plainDate;
}
