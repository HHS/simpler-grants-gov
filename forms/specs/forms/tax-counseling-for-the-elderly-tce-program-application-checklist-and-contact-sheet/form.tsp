import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/person/index.tsp";
import "#questions/types/address.tsp";
import "#questions/organization/index.tsp";
import "#questions/submission/index.tsp";
import "#questions/types/yes-no.tsp";
using SimplerForms;
namespace Forms.IRSTCE14204;

model IRSTCECoverAddress {
  @UI.label("Street address line 1")
  street1: Questions.Types.AddressParts.Street1;

  @UI.label("Street address line 2")
  street2?: Questions.Types.AddressParts.Street2;

  @UI.label("City") city: Questions.Types.AddressParts.City;

  @UI.label("State")
  @Validation.requiredWhen(
    IRSTCECoverAddress.country,
    Questions.Types.CountryCode.USA
  )
  @UI.widget(Rendering.Widget.Select)
  state?: Questions.Types.StateCode;

  @UI.label("Province") province?: Questions.Types.AddressParts.Province;

  @UI.label("Country")
  @UI.widget(Rendering.Widget.Select)
  country: Questions.Types.CountryCode;

  @UI.label("Zip / Postal Code")
  @Validation.requiredWhen(
    IRSTCECoverAddress.country,
    Questions.Types.CountryCode.USA
  )
  zipCode?: Questions.Types.AddressParts.ZipCode;
}

model IRSTCEContactInformation {
  @UI.label("Name of organization")
  @doc("Pre-populated from the SF 424. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  organizationName: Questions.Organizations.OrgName;

  @UI.label("Address of organization") address: IRSTCECoverAddress;

  @UI.label("Telephone")
  @doc("Pre-populated from the SF 424. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  phone: Questions.People.PersonPhoneNumber;

  @UI.label("FAX Number")
  @doc("Pre-populated from the SF 424. ")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  fax?: Questions.People.PersonPhoneNumber;

  @UI.label("Point of Contact (POC) name")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  name: Questions.People.PersonName;

  @UI.label("Point of Contact (POC) title")
  @doc("Pre-populated from the SF 424. ")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  title?: Questions.People.PersonTitle;

  @UI.label("Email address for POC")
  @doc("Pre-populated from the SF 424. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  email: Questions.People.PersonEmail;
}

model IRSTCEAdministrativeInformation {
  @UI.label("Has your organization registered or renewed your registration this year through the System for Award Management (SAM) at www.sam.gov?")
  @doc("One selection is required.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  samRegistration: Questions.Types.YesNo;

  @UI.label("Is your organization interested in applying for a multi-year grant?")
  @doc("One selection is required.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  multiyearGrant: Questions.Types.YesNo;

  @UI.label("If YES, have you checked the criteria under the Multi-Year Grant Opportunities section of Publication 1101 to determine if your organization is eligible to apply?")
  @doc("One selection is required.")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhen(
    IRSTCEAdministrativeInformation.multiyearGrant,
    Questions.Types.YesNo.yes
  )
  @Validation.requiredWhen(
    IRSTCEAdministrativeInformation.multiyearGrant,
    Questions.Types.YesNo.yes
  )
  @Meta.role(ResponseRole.applicantInput)
  checkedEligible?: Questions.Types.YesNo;
}

model IRSTCEApplicationChecklist {
  @UI.label("1. Form 14204, TCE Application Checklist & Contact Sheet (this sheet)")
  @doc("This field is required. Check to select. ")
  @UI.widget(Rendering.Widget.Checkbox)
  @Validation.constraints(#{ pattern: "^Y:\\x20Yes$" })
  @Meta.role(ResponseRole.applicantInput)
  form14204: Questions.Types.YesNo;

  @UI.label("2. Background Narrative")
  @doc("This field is required. Check to select. ")
  @UI.widget(Rendering.Widget.Checkbox)
  @Validation.constraints(#{ pattern: "^Y:\\x20Yes$" })
  @Meta.role(ResponseRole.applicantInput)
  backgroundNarrative: Questions.Types.YesNo;

  @UI.label("3. Nonprofit Status Determination letter issued by the Internal Revenue Service")
  @doc("This field is required. Check to select. ")
  @UI.widget(Rendering.Widget.Checkbox)
  @Validation.constraints(#{ pattern: "^Y:\\x20Yes$" })
  @Meta.role(ResponseRole.applicantInput)
  nonprofitStatus: Questions.Types.YesNo;

  @UI.label("4. Explanation on the organization’s letterhead, if Federal tax returns are not required to be file")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  explanationFederalTax?: Questions.Types.YesNo;

  @UI.label("5. Proposed Program/Budget Plan")
  @doc("This field is required. Check to select. ")
  @UI.widget(Rendering.Widget.Checkbox)
  @Validation.constraints(#{ pattern: "^Y:\\x20Yes$" })
  @Meta.role(ResponseRole.applicantInput)
  programBudgetPlan: Questions.Types.YesNo;

  @UI.label("6. Form 8653 - TCE Application Plan")
  @doc("This field is required. Check to select. ")
  @UI.widget(Rendering.Widget.Checkbox)
  @Validation.constraints(#{ pattern: "^Y:\\x20Yes$" })
  @Meta.role(ResponseRole.applicantInput)
  form8653: Questions.Types.YesNo;

  @UI.label("7. Standard Form 424, Application for Federal Assistance")
  @doc("This field is required. Check to select. ")
  @UI.widget(Rendering.Widget.Checkbox)
  @Validation.constraints(#{ pattern: "^Y:\\x20Yes$" })
  @Meta.role(ResponseRole.applicantInput)
  standardForm424: Questions.Types.YesNo;

  @UI.label("8. Civil Rights Narrative")
  @doc("This field is required. Check to select. ")
  @UI.widget(Rendering.Widget.Checkbox)
  @Validation.constraints(#{ pattern: "^Y:\\x20Yes$" })
  @Meta.role(ResponseRole.applicantInput)
  civilRightsNarrative: Questions.Types.YesNo;

  @UI.label("9. Form 14335, Contact Information for VITA & TCE")
  @doc("This field is required. Check to select. ")
  @UI.widget(Rendering.Widget.Checkbox)
  @Validation.constraints(#{ pattern: "^Y:\\x20Yes$" })
  @Meta.role(ResponseRole.applicantInput)
  form14335: Questions.Types.YesNo;

  @UI.label("10. Standard Form LLL, Disclosure of Lobbying Activities (if required)")
  @doc("Check to select.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  standardFormLLL?: Questions.Types.YesNo;
}

@Meta.form(#{
  id: "tax-counseling-for-the-elderly-tce-program-application-checklist-and-contact-sheet",
  formName: "Tax Counseling for the Elderly (TCE) Program Application Checklist and Contact Sheet",
})
@GrantsGov.form(#{
  legacyFormId: 694,
  shortFormName: "Form_14204_2_0",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "1545-2222",
  expirationDate: "2028-08-31",
})
@example(
  #{
    contactInformation: #{
      organizationName: "Illustrative Senior Tax Services",
      address: #{
        street1: "100 Example Avenue",
        city: "Denver",
        state: Questions.Types.StateCode.CO,
        country: Questions.Types.CountryCode.USA,
        zipCode: "80202",
      },
      phone: "2025550100",
      name: #{ firstName: "Jordan", lastName: "Lee" },
      email: "contact@example.org",
    },
    administrativeInformation: #{
      samRegistration: Questions.Types.YesNo.yes,
      multiyearGrant: Questions.Types.YesNo.no,
    },
    applicationChecklist: #{
      form14204: Questions.Types.YesNo.yes,
      backgroundNarrative: Questions.Types.YesNo.yes,
      nonprofitStatus: Questions.Types.YesNo.yes,
      programBudgetPlan: Questions.Types.YesNo.yes,
      form8653: Questions.Types.YesNo.yes,
      standardForm424: Questions.Types.YesNo.yes,
      civilRightsNarrative: Questions.Types.YesNo.yes,
      form14335: Questions.Types.YesNo.yes,
    },
  },
  #{
    title: "Single-year application with all required checklist items affirmed",
    description: "Synthetic supplied contact context. No document upload or application eligibility is inferred.",
  }
)
@example(
  #{
    contactInformation: #{
      organizationName: "Illustrative Senior Tax Services",
      address: #{
        street1: "100 Example Avenue",
        city: "Denver",
        state: Questions.Types.StateCode.CO,
        country: Questions.Types.CountryCode.USA,
        zipCode: "80202",
      },
      phone: "2025550100",
      name: #{ firstName: "Jordan", lastName: "Lee" },
      email: "contact@example.org",
    },
    administrativeInformation: #{
      samRegistration: Questions.Types.YesNo.yes,
      multiyearGrant: Questions.Types.YesNo.yes,
      checkedEligible: Questions.Types.YesNo.yes,
    },
    applicationChecklist: #{
      form14204: Questions.Types.YesNo.yes,
      backgroundNarrative: Questions.Types.YesNo.yes,
      nonprofitStatus: Questions.Types.YesNo.yes,
      programBudgetPlan: Questions.Types.YesNo.yes,
      form8653: Questions.Types.YesNo.yes,
      standardForm424: Questions.Types.YesNo.yes,
      civilRightsNarrative: Questions.Types.YesNo.yes,
      form14335: Questions.Types.YesNo.yes,
      explanationFederalTax: Questions.Types.YesNo.yes,
      standardFormLLL: Questions.Types.YesNo.no,
    },
  },
  #{
    title: "Multi-year interest with explicit eligibility-review answer",
    description: "The followup is independently answered. Optional checklist items are included without changing mandatory items.",
  }
)
model IRSTCEChecklist {
  @UI.label("Contact Information")
  @doc("Supplied from the SF-424; review these values as readonly context.")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  contactInformation: IRSTCEContactInformation;

  @UI.label("Administrative Information")
  administrativeInformation: IRSTCEAdministrativeInformation;

  @UI.label("Application Checklist and Assembly")
  applicationChecklist: IRSTCEApplicationChecklist;
}
