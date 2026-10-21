import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "#xsd/global-library.tsp";

import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** Key_Contacts_2_0-V2.0.xsd, mapped from the tutorial form. */
namespace XSD.KeyContactsTutorial20;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.KeyContactsTutorial.KeyContactsTutorial;
alias Contact = Forms.KeyContactsTutorial.TutorialKeyContact;
alias GlobLib = XSD.GlobLib;

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
  contactName: GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, Contact.title)
  @name("ContactTitle")
  contactTitle?: string;

  @Mapping.from(grantsGovXml, Contact.organizationalAffiliation)
  @name("ContactOrganizationalAffiliation")
  contactOrganizationalAffiliation?: string;

  @Mapping.from(grantsGovXml, Contact.address)
  @name("ContactAddress")
  contactAddress: GlobLib.AddressDataTypeV3;

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
