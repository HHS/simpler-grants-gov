import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/person/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/types/address.tsp";
import "#questions/types/yes-no.tsp";
using SimplerForms;
namespace Forms.IRS14335;
// Local contact composition: no address, no extra optional fields, and no new question identity.
model IRS14335Contact {
  @UI.label("Name") name: Questions.People.PersonName;
  @UI.label("Title") title: Questions.People.PersonTitle;
  @UI.label("Phone number") phone: Questions.People.PersonPhoneNumber;

  @UI.label("Cell phone number")
  @doc("Enter the cell phone number.")
  cellPhone?: Questions.People.PersonPhoneNumber;

  @UI.label("Email address") email: Questions.People.PersonEmail;
}
model IRS14335PrimaryContact extends IRS14335Contact {
  @UI.label("Name")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  name: Questions.People.PersonName;

  @UI.label("Phone number")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  phone: Questions.People.PersonPhoneNumber;

  @UI.label("Email address")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  email: Questions.People.PersonEmail;

  @UI.label("May the IRS share the Primary Contacts information with other grant recipients and non-grant recipients involved in the VITA or TCE program")
  @doc("One selection is required.")
  @UI.widget(Rendering.Widget.Radio)
  shareContact: Questions.Types.YesNo;
}
model IRS14335AlternateContact extends IRS14335Contact {
  @UI.label("May the IRS share the Alternate Contacts information with other grant recipients and non-grant recipients involved in the VITA or TCE program")
  @doc("One selection is required.")
  @UI.widget(Rendering.Widget.Radio)
  shareContact: Questions.Types.YesNo;
}
model IRS14335AORContact extends IRS14335Contact {
  @UI.label("Name")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  name: Questions.People.PersonName;

  @UI.label("Title")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  title: Questions.People.PersonTitle;

  @UI.label("Phone number")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  phone: Questions.People.PersonPhoneNumber;

  @UI.label("Email address")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  email: Questions.People.PersonEmail;

  @UI.label("May the IRS share the Authorized Organization Representatives information with other grant recipients and non-grant recipients involved in the VITA or TCE program")
  @doc("One selection is required.")
  @UI.widget(Rendering.Widget.Radio)
  shareContact: Questions.Types.YesNo;
}
model IRS14335OtherContact {
  @UI.label("Explain role:")
  @doc("Please explain their role in the space provided.")
  @minLength(1)
  @maxLength(60)
  role: string;

  ...IRS14335Contact;

  @UI.label("May the IRS share this other contact’s information with other grant recipients and non-grant recipients involved in the VITA or TCE program?")
  @doc("Select one.")
  @UI.widget(Rendering.Widget.Select)
  shareContact: Questions.Types.YesNo;
}
// Source order differs from global AddressDataTypeV3 and has no County answer.
model IRS14335Address {
  @UI.label("Street address line 1")
  street1: Questions.Types.AddressParts.Street1;

  @UI.label("Street address line 2")
  street2?: Questions.Types.AddressParts.Street2;

  @UI.label("City") city: Questions.Types.AddressParts.City;

  @UI.label("State")
  @UI.widget(Rendering.Widget.Select)
  @Validation.requiredWhen(
    IRS14335Address.country,
    Questions.Types.CountryCode.USA
  )
  state?: Questions.Types.StateCode;

  @UI.label("Province") province?: Questions.Types.AddressParts.Province;

  @UI.label("Country")
  @UI.widget(Rendering.Widget.Select)
  country: Questions.Types.CountryCode;

  @UI.label("Zip / Postal Code")
  @Validation.requiredWhen(
    IRS14335Address.country,
    Questions.Types.CountryCode.USA
  )
  zipCode?: Questions.Types.AddressParts.ZipCode;
}
const IRS14335Minimum = #{
  organizationName: "Illustrative Tax Assistance",
  organizationAddress: #{
    street1: "100 Example Avenue",
    city: "Denver",
    state: Questions.Types.StateCode.CO,
    country: Questions.Types.CountryCode.USA,
    zipCode: "80202",
  },
  daysOperation: "Monday through Friday",
  hoursOperation: "9 a.m. to 5 p.m.",
  primaryContact: #{
    name: #{ firstName: "Jordan", lastName: "Lee" },
    title: "Primary Coordinator",
    phone: "2025550101",
    email: "primary@example.org",
    shareContact: Questions.Types.YesNo.no,
  },
  alternateContact: #{
    name: #{ firstName: "Morgan", lastName: "Patel" },
    title: "Alternate Coordinator",
    phone: "2025550102",
    email: "alternate@example.org",
    shareContact: Questions.Types.YesNo.yes,
  },
  authorizedRepresentative: #{
    name: #{ firstName: "Alex", lastName: "Rivera" },
    title: "Director",
    phone: "2025550103",
    email: "aor@example.org",
    shareContact: Questions.Types.YesNo.no,
  },
  federalTaxMattersContact: #{
    name: #{ firstName: "Robin", lastName: "Kim" },
    title: "Tax Contact",
    phone: "2025550104",
    email: "tax@example.org",
  },
  financialPmsContact: #{
    name: #{ firstName: "Casey", lastName: "Chen" },
    title: "Finance Contact",
    phone: "2025550105",
    email: "finance@example.org",
  },
};

@Meta.form(#{
  id: "contact-information-for-vita-and-tce-grant-programs",
  formName: "Contact Information for VITA and TCE Grant Programs",
})
@GrantsGov.form(#{
  legacyFormId: 710,
  shortFormName: "Form_14335_2_0",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "1545-2222",
  expirationDate: "2028-08-31",
})
@example(
  #{
    ...IRS14335Minimum,
    otherContact1: #{
      role: "Illustrative program support",
      name: #{ firstName: "Taylor", lastName: "Jordan" },
      title: "Support Coordinator",
      phone: "2025550198",
      email: "other1@example.org",
      shareContact: Questions.Types.YesNo.no,
    },
    otherContact3: #{
      role: "Illustrative finance support",
      name: #{ firstName: "Jamie", lastName: "Rivera" },
      title: "Finance Support",
      phone: "2025550199",
      email: "other3@example.org",
      shareContact: Questions.Types.YesNo.yes,
    },
  },
  #{
    title: "Independent first and third Other Contact slots",
    description: "Source-named optional slots remain independent. Entered permissions do not authorize another role or prefill the second slot.",
  }
)
@example(
  IRS14335Minimum,
  #{
    title: "Required contacts with illustrative supplied cover values",
    description: "All names/contact data are fictitious. Cover fields are synthetic readonly context; sharing choices are independent answers per role.",
  }
)
model IRS14335 {
  @UI.label("Recipient name")
  @doc("Pre-populated from the SF 424. This field is required.")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  organizationName: Questions.Organizations.OrgName;

  @UI.label("Federal Award Identifier")
  @doc("Pre-populated from the SF 424.")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @minLength(1)
  @maxLength(25)
  federalAwardIdentifier?: string;

  @UI.label("Organization Address")
  @doc("Pre-populated from the SF 424. US state and postal code are required for the United States.")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  organizationAddress: IRS14335Address;

  @UI.label("Days of operation")
  @doc("Enter the days of operation. This field is required.")
  @minLength(1)
  @maxLength(65)
  daysOperation: string;

  @UI.label("Hours of operation")
  @doc("Enter the hours of operation. This field is required.")
  @minLength(1)
  @maxLength(30)
  hoursOperation: string;

  @UI.label("Primary Contact Information")
  @doc("Name, phone and email are supplied from SF-424; title, cell phone and sharing permission are entered here.")
  primaryContact: IRS14335PrimaryContact;

  @UI.label("Alternate Contact Information")
  alternateContact: IRS14335AlternateContact;

  @UI.label("Authorized Organization Representative Information")
  @doc("Name, title, phone and email are supplied from SF-424; cell phone and sharing permission are entered here.")
  authorizedRepresentative: IRS14335AORContact;

  @UI.label("Federal Tax Matters Contact Information")
  federalTaxMattersContact: IRS14335Contact;

  @UI.label("Financial/PMS Contact Information")
  financialPmsContact: IRS14335Contact;

  @UI.label("Other Contact 1")
  @doc("Optional source-named slot. Once used, role, first/last name, title, phone, email and sharing answer are required.")
  otherContact1?: IRS14335OtherContact;

  @UI.label("Other Contact 2")
  @doc("Optional source-named slot. Once used, role, first/last name, title, phone, email and sharing answer are required.")
  otherContact2?: IRS14335OtherContact;

  @UI.label("Other Contact 3")
  @doc("Optional source-named slot. Once used, role, first/last name, title, phone, email and sharing answer are required.")
  otherContact3?: IRS14335OtherContact;
}
