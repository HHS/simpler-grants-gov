import "@typespec/xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "#questions/person/index.tsp";
import "#questions/types/address.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** GlobalLibrary-V2.0.xsd: the data types every Grants.gov form shares. */
namespace XSD.GlobLib;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias PersonName = Questions.People.PersonName;
alias Address = Questions.Types.Address;

@nsDeclarations
enum Namespaces {
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}

/** `globLib:HumanNameDataType` */
@ns(Namespaces.globLib)
model HumanNameDataType {
  @Mapping.from(grantsGovXml, PersonName.prefix)
  @name("PrefixName")
  prefixName?: string;

  @Mapping.from(grantsGovXml, PersonName.firstName)
  @name("FirstName")
  firstName: string;

  @Mapping.from(grantsGovXml, PersonName.middleName)
  @name("MiddleName")
  middleName?: string;

  @Mapping.from(grantsGovXml, PersonName.lastName)
  @name("LastName")
  lastName: string;

  @Mapping.from(grantsGovXml, PersonName.suffix)
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

// Filled from each form's own person model; see the form's xsd.tsp.
/** `globLib:ContactPersonDataTypeV3` */
@ns(Namespaces.globLib)
model ContactPersonDataTypeV3 {
  @name("Name")
  name: HumanNameDataType;

  @name("Title")
  title?: string;

  @name("Address")
  address: AddressDataTypeV3;

  @name("Phone")
  phone?: string;

  @name("Fax")
  fax?: string;

  @name("Email")
  email?: string;
}
