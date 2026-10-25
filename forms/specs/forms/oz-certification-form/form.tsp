import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/person/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/submission/index.tsp";
import "#questions/types/yes-no.tsp";
using SimplerForms;
namespace Forms.HUDOZ;

enum HUDOZApplicationCriteria {
  v0: "Solely within",
  v1: "Within and other communities",
  v2: "Outside",
}
enum HUDOZFundingRange {
  v0: "76% - 100%",
  v1: "51% - 75%",
  v2: "26% - 50%",
  v3: "11% - 25%",
  v4: "1% - 10%",
}
model HUDOZRepresentative {
  @UI.label("Name")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  name: Questions.People.PersonName;

  @UI.label("Title:")
  @doc("Pre-populated from the SF-424. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  title: Questions.People.PersonTitle;

  @UI.label("Organization:")
  @doc("Pre-populated from the SF-424. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  organizationName: Questions.Organizations.OrgName;
}

@Meta.form(#{ id: "oz-certification-form", formName: "OZ Certification Form" })
@GrantsGov.form(#{
  legacyFormId: 704,
  shortFormName: "OZ_Certification_Form",
  formVersion: "1.0",
  agencyCode: "SGG",
  ombNumber: "2501-0044",
  expirationDate: "2027-02-28",
})
@example(
  #{
    organizationName: "Illustrative Community Services",
    censusTracts: "06067001101",
    applicationCriteria: HUDOZApplicationCriteria.v0,
    estimatedFundingAllocations: HUDOZFundingRange.v0,
    authorizedRepresentative: #{
      name: #{ firstName: "Jordan", lastName: "Lee" },
      title: "Director",
      organizationName: "Illustrative Community Services",
    },
    signature: "ILLUSTRATIVE SUBMISSION CONTEXT",
    signatureDate: plainDate.fromISO("2026-10-25"),
  },
  #{
    title: "One source whole census-tract answer and funding range",
    description: "Ranges are choices, not decimal calculations. All supplied context is fictitious.",
  }
)
@example(
  #{
    organizationName: "Illustrative Community Services",
    censusTracts: "06067001101; 06067001200",
    applicationCriteria: HUDOZApplicationCriteria.v1,
    estimatedFundingAllocations: HUDOZFundingRange.v3,
    authorizedRepresentative: #{
      name: #{ firstName: "Jordan", lastName: "Lee" },
      title: "Director",
      organizationName: "Illustrative Community Services",
    },
    signature: "ILLUSTRATIVE SUBMISSION CONTEXT",
    signatureDate: plainDate.fromISO("2026-10-25"),
    narrative: "Illustrative community services support housing and education in the listed census tracts.",
    housing: Questions.Types.YesNo.yes,
    education: Questions.Types.YesNo.yes,
    federalProgram: "14.000, Illustrative Community Program",
  },
  #{
    title: "Multiple source whole-text tracts and selected purposes",
    description: "The tract answer remains one source string. No parser, lookup or inferred eligibility is added.",
  }
)
model HUDOpportunityZoneCertification {
  @UI.label("Applicant Organization:")
  @doc("Pre-populated from the SF-424.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  organizationName: Questions.Organizations.OrgName;

  @UI.label("Assistance Listing number and Federal Program name to which the Applicant is applying:\nInclude the funding opportunity number and name exactly as it appears in the applicable funding opportunity announcement (example: 14.896, Family Self-Sufficiency Program).")
  @doc("Pre-populated from the SF-424.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(1)
  @maxLength(120)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  federalProgram?: string;

  @UI.label("Opportunity Zone census tracts")
  @doc("Opportunity Zone Census Tract(s),  which the proposed activities/projects will benefit:\nInclude below the full 11-digit census tract number (example: 06067001101). Designated Opportunity Zone Census Tracts can be found at: https://opportunityzones.hud.gov/resources. Select the “CDFI Fund Opportunity Zones Resources” link and then select the “List of designated Qualified Opportunity Zones.”\n\nEnter the Opportunity Zone Census Tract(s) which the proposed activities/projects will benefit. This field is required.")
  @UI.widget(Rendering.Widget.TextArea)
  @minLength(1)
  @maxLength(1000)
  @Meta.role(ResponseRole.applicantInput)
  censusTracts: string;

  @UI.label("The application meets which of the following criteria (please select one):")
  @doc("The application meets which of the following criteria (please select one). One selection is required.\n\nSolely within — The proposed activities/projects will occur solely within the Opportunity Zone Census Tract(s) listed above.\n\nWithin and other communities — The proposed activities/projects will occur within the Opportunity Zone Census Tract(s) listed above and other communities.\n\nOutside — The proposed activities/projects will occur outside Opportunity Zone Census Tracts, but substantial and direct benefits will accrue within the Opportunity Zone Census Tracts listed above.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  applicationCriteria: HUDOZApplicationCriteria;

  @UI.label("Estimated Funding Allocations")
  @doc("Estimate a percentage of the total dollar amount of awarded federal funding that would result in a direct benefit within the Opportunity Zone Census Tracts listed above. One selection is required.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  estimatedFundingAllocations: HUDOZFundingRange;

  @UI.label("Project support for Opportunity Zones")
  @doc("Provide a narrative explaining and/or reference the section in the application that explains how the project will support public and private investment in urban and economically distressed areas, specifically qualified Opportunity Zones (300-word limit):\n\nExample: “The Main Street project described in this application will stimulate economic opportunity and mobility, encourage entrepreneurship, expand quality educational opportunities, and promote workforce development for those families residing within the XYZ Opportunity Zone.”\n\nProvide a narrative explaining and/or reference the section in the application that explains how the project will support public and private investment in urban and economically distressed areas, specifically qualified Opportunity Zones (300-word limit).")
  @UI.widget(Rendering.Widget.TextArea)
  @minLength(0)
  @maxLength(1500)
  @Meta.role(ResponseRole.applicantInput)
  @pattern("^(?!\\s*\\S+(?:\\s+\\S+){300})[\\s\\S]*$")
  narrative?: string;

  @UI.label("Access to Capital")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  accessToCapital?: Questions.Types.YesNo;

  @UI.label("Asset Building")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  assetBuilding?: Questions.Types.YesNo;

  @UI.label("Business Assistance")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  businessAssistance?: Questions.Types.YesNo;

  @UI.label("Community Capacity Building")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  communityCapacityBuilding?: Questions.Types.YesNo;

  @UI.label("Economic Development")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  economicDevelopment?: Questions.Types.YesNo;

  @UI.label("Education")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  education?: Questions.Types.YesNo;

  @UI.label("Healthy Food Access")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  healthyFoodAccess?: Questions.Types.YesNo;

  @UI.label("Health")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  health?: Questions.Types.YesNo;

  @UI.label("Housing")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  housing?: Questions.Types.YesNo;

  @UI.label("Human Services and Family Support")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  humanServicesandFamilySupport?: Questions.Types.YesNo;

  @UI.label("Community Infrastructure")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  communityInfrastructure?: Questions.Types.YesNo;

  @UI.label("Public Safety")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  publicSafety?: Questions.Types.YesNo;

  @UI.label("Workforce Development")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  workforceDevelopment?: Questions.Types.YesNo;

  @UI.label("Low Income Housing Tax Credit (LIHTC) or other rent restricted housing")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  lowIncomeHousingTaxCredit?: Questions.Types.YesNo;

  @UI.label("Market rate housing")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  marketRateHousing?: Questions.Types.YesNo;

  @UI.label("Industrial development")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  industrialDevelopment?: Questions.Types.YesNo;

  @UI.label("Commercial or retail development")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  commercialDevelopment?: Questions.Types.YesNo;

  @UI.label("Other business development")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  otherBusinessDevelopment?: Questions.Types.YesNo;

  @UI.label("“Above ground” infrastructure – streets, sidewalks, lighting")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  aboveGroundInfrastructure?: Questions.Types.YesNo;

  @UI.label("“Below ground” infrastructure – water, sewer, gas, electric")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  belowGroundInfrastructure?: Questions.Types.YesNo;

  @UI.label("Schools or other educational facilities")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  schools?: Questions.Types.YesNo;

  @UI.label("Hospitals or other health care facilities")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  hospitals?: Questions.Types.YesNo;

  @UI.label("Authorized Representative")
  @doc("Pre-populated from the SF-424; read-only context.")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  authorizedRepresentative: HUDOZRepresentative;

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
