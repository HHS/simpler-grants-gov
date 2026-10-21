import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";

import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** Key_Contacts_2_0-V2.0.xsd, mapped from the tutorial form. */
namespace XSD.KeyContactsTutorial20;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.KeyContactsTutorial.KeyContactsTutorial;
alias Contact = Forms.KeyContactsTutorial.TutorialKeyContact;
alias Name = Forms.KeyContactsTutorial.TutorialContactName;
alias Address = Forms.KeyContactsTutorial.TutorialContactAddress;

@nsDeclarations
enum Namespaces {
  Key_Contacts_2_0: "http://apply.grants.gov/forms/Key_Contacts_2_0-V2.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}

@name("Key_Contacts_2_0")
@ns(Namespaces.Key_Contacts_2_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/Key_Contacts_2_0-V2.0.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @Mapping.from(grantsGovXml, Form.applicantOrganizationName)
  @name("ApplicantOrganizationName")
  applicantOrganizationName: string;

  @Mapping.from(grantsGovXml, Form.keyContacts)
  @name("RoleOnProject")
  @maxItems(4)
  roleOnProject: RoleOnProject[];

  @attribute @name("FormVersion") formVersion: "2.0";
}

@ns(Namespaces.Key_Contacts_2_0)
model RoleOnProject {
  @Mapping.from(grantsGovXml, Contact.projectRole)
  @name("ContactProjectRole")
  contactProjectRole: string;

  @Mapping.from(grantsGovXml, Contact.name)
  @name("ContactName")
  contactName: HumanNameDataType;

  @Mapping.from(grantsGovXml, Contact.title)
  @name("ContactTitle")
  contactTitle?: string;

  @Mapping.from(grantsGovXml, Contact.organizationalAffiliation)
  @name("ContactOrganizationalAffiliation")
  contactOrganizationalAffiliation?: string;

  @Mapping.from(grantsGovXml, Contact.address)
  @name("ContactAddress")
  contactAddress: AddressDataTypeV3;

  @Mapping.from(grantsGovXml, Contact.phone)
  @name("ContactPhone")
  contactPhone: string;

  @Mapping.from(grantsGovXml, Contact.fax)
  @name("ContactFax")
  contactFax?: string;

  @Mapping.from(grantsGovXml, Contact.email)
  @name("ContactEmail")
  contactEmail: string;
}

// The tutorial form declares its own name and address, so it can't reuse the shared models in
// specs/xsd/global-library.tsp: those are mapped from the question bank's PersonName and Address.

/** `globLib:HumanNameDataType` */
@ns(Namespaces.globLib)
model HumanNameDataType {
  @Mapping.from(grantsGovXml, Name.prefix)
  @name("PrefixName")
  prefixName?: string;

  @Mapping.from(grantsGovXml, Name.firstName)
  @name("FirstName")
  firstName: string;

  @Mapping.from(grantsGovXml, Name.middleName)
  @name("MiddleName")
  middleName?: string;

  @Mapping.from(grantsGovXml, Name.lastName)
  @name("LastName")
  lastName: string;

  @Mapping.from(grantsGovXml, Name.suffix)
  @name("SuffixName")
  suffixName?: string;
}

/** `globLib:AddressDataTypeV3`. State and Province are an `xs:choice`. */
@ns(Namespaces.globLib)
model AddressDataTypeV3 {
  @Mapping.from(grantsGovXml, Address.street1)
  @name("Street1")
  street1: string;

  @Mapping.from(grantsGovXml, Address.street2)
  @name("Street2")
  street2?: string;

  @Mapping.from(grantsGovXml, Address.city)
  @name("City")
  city: string;

  @Mapping.from(grantsGovXml, Address.county)
  @name("County")
  county?: string;

  @Mapping.from(grantsGovXml, Address.state)
  @name("State")
  state?: string;

  @Mapping.from(grantsGovXml, Address.province)
  @name("Province")
  province?: string;

  @Mapping.from(grantsGovXml, Address.zipCode)
  @name("ZipPostalCode")
  zipPostalCode?: string;

  @Mapping.from(grantsGovXml, Address.country)
  @name("Country")
  country: string;
}
