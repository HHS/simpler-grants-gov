import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "#xsd/global-library.tsp";

import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** Key_Contacts_2_0-V2.0.xsd */
namespace XSD.KeyContacts20;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias KeyContacts = Forms.KeyContacts.KeyContacts;
alias KeyContact = Forms.KeyContacts.KeyContact;
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
@Mapping.from(grantsGovXml, KeyContacts)
model Root {
  @Mapping.from(grantsGovXml, KeyContacts.applicantOrganizationName)
  @name("ApplicantOrganizationName")
  applicantOrganizationName: string;

  @Mapping.from(grantsGovXml, KeyContacts.keyContacts)
  @name("RoleOnProject")
  @maxItems(4)
  roleOnProject: RoleOnProject[];

  @attribute @name("FormVersion") formVersion: "2.0";
}

@ns(Namespaces.Key_Contacts_2_0)
model RoleOnProject {
  @Mapping.from(grantsGovXml, KeyContact.projectRole)
  @name("ContactProjectRole")
  contactProjectRole: string;

  @Mapping.from(grantsGovXml, KeyContact.name)
  @name("ContactName")
  contactName: GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, KeyContact.title)
  @name("ContactTitle")
  contactTitle?: string;

  @Mapping.from(grantsGovXml, KeyContact.organizationalAffiliation)
  @name("ContactOrganizationalAffiliation")
  contactOrganizationalAffiliation?: string;

  @Mapping.from(grantsGovXml, KeyContact.address)
  @name("ContactAddress")
  contactAddress: GlobLib.AddressDataTypeV3;

  @Mapping.from(grantsGovXml, KeyContact.phone)
  @name("ContactPhone")
  contactPhone: string;

  @Mapping.from(grantsGovXml, KeyContact.fax)
  @name("ContactFax")
  contactFax?: string;

  @Mapping.from(grantsGovXml, KeyContact.email)
  @name("ContactEmail")
  contactEmail: string;
}
