import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/person/index.tsp";
import "#questions/types/address.tsp";
import "#questions/organization/index.tsp";
import "#questions/submission/index.tsp";
import "#questions/types/yes-no.tsp";
using SimplerForms;
namespace Forms.ACHSF3881;

enum ACHFileFormat {
  v0: "CCD+",
  v1: "CTX",
}
enum ACHAccountType {
  v0: "Checking",
  v1: "Savings",
  v2: "Lockbox",
}
model ACHAgencyContext {
  @UI.label("Agency Name:")
  @doc("Pre-populated from the Application cover sheet.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(1)
  @maxLength(60)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  name: string;

  @UI.label("Agency Identifier:")
  @doc("To be completed by Agency.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(0)
  @maxLength(12)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  identifier?: string;

  @UI.label("Agency Location Code (ALC):")
  @doc("To be completed by Agency.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(0)
  @maxLength(12)
  @pattern("^[0-9]*$")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  locationCode?: string;

  @UI.label("ACH Format:")
  @doc("To be completed by Agency.")
  @UI.widget(Rendering.Widget.Radio)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  achFormat?: ACHFileFormat;

  @UI.label("Address") address?: Questions.Types.Address;

  @UI.label("Contact Person Name")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  contactName?: Questions.People.PersonName;

  @UI.label("Telephone Number:")
  @doc("To be completed by Agency.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  phone?: Questions.People.PersonPhoneNumber;

  @UI.label("Additional Information:")
  @doc("To be completed by Agency.")
  @UI.widget(Rendering.Widget.TextArea)
  @minLength(0)
  @maxLength(500)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  additionalInformation?: string;
}

model ACHPayee {
  @UI.label("Organization Name (Legal Name):")
  @doc("Enter the legal name of the applicant that will undertake the assistance activity. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @Meta.role(ResponseRole.applicantInput)
  organizationName: Questions.Organizations.OrgName;

  @UI.label("SSN No. or Taxpayer ID No.:")
  @doc("Enter either SSN or TIN as assigned by the Internal Revenue Service.  If your organization is not in the US, enter 44-4444444. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(9)
  @maxLength(30)
  @Meta.role(ResponseRole.applicantInput)
  taxIdentifier: string;

  @UI.label("Address") address: Questions.Types.Address;

  @UI.label("Contact Person Name")
  @Meta.role(ResponseRole.applicantInput)
  contactName: Questions.People.PersonName;

  @UI.label("Telephone Number:")
  @doc("Enter the daytime Telephone Number. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @Meta.role(ResponseRole.applicantInput)
  phone: Questions.People.PersonPhoneNumber;
}

model ACHAuthorizedOfficial {
  @UI.label("Name")
  @Meta.role(ResponseRole.applicantInput)
  name: Questions.People.PersonName;

  @UI.label("Title of Authorized Official:")
  @doc("Enter title of authorized official. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(1)
  @maxLength(60)
  @Meta.role(ResponseRole.applicantInput)
  title: string;

  @UI.label("Telephone Number:")
  @doc("Enter the daytime Telephone Number. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @Meta.role(ResponseRole.applicantInput)
  phone: Questions.People.PersonPhoneNumber;
}

model ACHFinancialInstitution {
  @UI.label("Name of Financial Institution:")
  @doc("Enter name of financial institution.  This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(1)
  @maxLength(55)
  @Meta.role(ResponseRole.applicantInput)
  name: string;

  @UI.label("Address") address: Questions.Types.Address;

  @UI.label("ACH Coordinator Name")
  @Meta.role(ResponseRole.applicantInput)
  achCoordinator: Questions.People.PersonName;

  @UI.label("Telephone Number:")
  @doc("Enter the daytime Telephone Number. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @Meta.role(ResponseRole.applicantInput)
  phone: Questions.People.PersonPhoneNumber;

  @UI.label("Nine-Digit Routing Transit Number:")
  @doc("Enter Nine-Digit Routing Transit Number. Numbers only. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(9)
  @maxLength(9)
  @pattern("^[0-9]{9}$")
  @Meta.role(ResponseRole.applicantInput)
  routingTransitNumber: string;

  @UI.label("Depositor Account Title:")
  @doc("Enter Depositor Account Title. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(1)
  @maxLength(50)
  @Meta.role(ResponseRole.applicantInput)
  accountTitle: string;

  @UI.label("Depositor Account Number:")
  @doc("Enter Depositor Account Number. This field is required.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(4)
  @maxLength(30)
  @pattern("^[0-9]+$")
  @Meta.role(ResponseRole.applicantInput)
  accountNumber: string;

  @UI.label("Lockbox Number:")
  @doc("Enter Lockbox Number.")
  @UI.widget(Rendering.Widget.Text)
  @minLength(0)
  @maxLength(20)
  @Meta.role(ResponseRole.applicantInput)
  lockboxNumber?: string;

  @UI.label("Type of Account:")
  @doc("Select Type of Account.")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  accountType?: ACHAccountType;

  @UI.label("Authorized Official")
  @doc("The source group contains name, title and phone. It defines no separate signature value.")
  authorizedOfficial: ACHAuthorizedOfficial;
}

@Meta.form(#{
  id: "ach-vendor-miscellaneous-payment-enrollment-form",
  formName: "ACH Vendor/Miscellaneous Payment Enrollment Form",
})
@GrantsGov.form(#{
  legacyFormId: 666,
  shortFormName: "SF3881_2_0",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "1530-0069",
  expirationDate: "2025-08-31",
})
@example(
  #{
    agency: #{ name: "Illustrative Federal Agency" },
    payee: #{
      organizationName: "Illustrative Payee Organization",
      taxIdentifier: "00-0000000",
      address: #{
        street1: "100 Example Avenue",
        city: "Denver",
        state: Questions.Types.StateCode.CO,
        country: Questions.Types.CountryCode.USA,
        zipCode: "80202",
      },
      contactName: #{ firstName: "Jordan", lastName: "Lee" },
      phone: "2025550101",
    },
    financialInstitution: #{
      name: "Illustrative Bank - Not Real",
      address: #{
        street1: "100 Example Avenue",
        city: "Denver",
        state: Questions.Types.StateCode.CO,
        country: Questions.Types.CountryCode.USA,
        zipCode: "80202",
      },
      achCoordinator: #{ firstName: "Morgan", lastName: "Patel" },
      phone: "2025550102",
      routingTransitNumber: "000123456",
      accountTitle: "ILLUSTRATIVE ONLY",
      accountNumber: "000012345678",
      authorizedOfficial: #{
        name: #{ firstName: "Alex", lastName: "Rivera" },
        title: "Illustrative Authorizing Official",
        phone: "2025550103",
      },
    },
  },
  #{
    title: "Synthetic US enrollment with leading-zero identifiers",
    description: "Entirely fictitious tax/bank/account data. No payment, verification, banking service or signing occurs.",
  }
)
@example(
  #{
    agency: #{
      name: "Illustrative Federal Agency",
      identifier: "DEMO",
      locationCode: "000012",
      achFormat: ACHFileFormat.v0,
      address: #{
        street1: "100 Example Avenue",
        city: "Denver",
        state: Questions.Types.StateCode.CO,
        country: Questions.Types.CountryCode.USA,
        zipCode: "80202",
      },
      contactName: #{ firstName: "Jordan", lastName: "Lee" },
      phone: "2025550104",
      additionalInformation: "Illustrative agency-owned context.",
    },
    payee: #{
      organizationName: "Illustrative Payee Organization",
      taxIdentifier: "44-4444444",
      address: #{
        street1: "10 Example Street",
        city: "Toronto",
        province: "Ontario",
        country: Questions.Types.CountryCode.CAN,
        zipCode: "M5H 1A1",
      },
      contactName: #{ firstName: "Jordan", lastName: "Lee" },
      phone: "2025550101",
    },
    financialInstitution: #{
      name: "Illustrative Bank - Not Real",
      address: #{
        street1: "100 Example Avenue",
        city: "Denver",
        state: Questions.Types.StateCode.CO,
        country: Questions.Types.CountryCode.USA,
        zipCode: "80202",
      },
      achCoordinator: #{ firstName: "Morgan", lastName: "Patel" },
      phone: "2025550102",
      routingTransitNumber: "000123456",
      accountTitle: "ILLUSTRATIVE ONLY",
      accountNumber: "000012345678",
      authorizedOfficial: #{
        name: #{ firstName: "Alex", lastName: "Rivera" },
        title: "Illustrative Authorizing Official",
        phone: "2025550103",
      },
      accountType: ACHAccountType.v0,
      lockboxNumber: "000010",
    },
  },
  #{
    title: "Foreign payee and full illustrative agency context",
    description: "Preserves different agency/payee/bank owners, optional groups and country-conditioned fields.",
  }
)
model ACHEnrollment {
  @UI.label("Agency information")
  @doc("Agency Name comes from the application cover; remaining fields are to be completed by the agency. These preview values are supplied readonly context.")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  agency: ACHAgencyContext;

  @UI.label("Payee/company information") payee: ACHPayee;

  @UI.label("Financial institution information")
  financialInstitution: ACHFinancialInstitution;
}
