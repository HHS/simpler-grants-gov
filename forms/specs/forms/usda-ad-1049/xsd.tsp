// Pinned source structure only. No active Mapping.from decorators: authentic cover
// and submission context and an integration-selected serializer remain explicit obligations.
import "@typespec/xml";
import "form-library-xml";
import "#questions/types/address.tsp";
import "#questions/types/yes-no.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/name.tsp";
import "#questions/person/title.tsp";
using TypeSpec.Xml;
namespace XSD.USDAAD1049;

@nsDeclarations
// Namespace prefix spelling is distinct from applicant answer identity.
enum Namespaces {
  AD_1049_2_0: "http://apply.grants.gov/forms/AD_1049_2_0-V2.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}

@name("AD_1049_2_0")
@ns(Namespaces.AD_1049_2_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/AD_1049_2_0-V2.0.xsd")
model Root {
  @name("PlaceofPerformance")
  @maxItems(10)
  placeofPerformance?: PlaceofPerformance[];

  @name("CheckWorkplaces")
  checkWorkplaces?: Questions.Types.YesNo;

  @name("OrganizationName")
  organizationName: Questions.Organizations.OrgName;

  @name("ProjectName")
  @minLength(1)
  @maxLength(60)
  projectName: string;

  @name("AuthorizedRepresentative")
  authorizedRepresentative: HumanName;

  @name("Title")
  title: Questions.People.PersonTitle;

  @name("AORSignature")
  @minLength(1)
  @maxLength(144)
  aorSignature: string;

  @name("DateSigned")
  dateSigned: plainDate;

  @attribute
  @name("FormVersion")
  formVersion: "2.0";
}

// These are the form's own eight sequential elements. State and Province are
// independently optional; substituting global AddressDataTypeV3's choice loses that fact.
@ns(Namespaces.AD_1049_2_0)
model PlaceofPerformance {
  @name("Street1") street1: Questions.Types.AddressParts.Street1;
  @name("Street2") street2?: Questions.Types.AddressParts.Street2;
  @name("City") city: Questions.Types.AddressParts.City;
  @name("County") county?: Questions.Types.AddressParts.County;
  @name("Country") country: Questions.Types.CountryCode;
  @name("State") state?: Questions.Types.StateCode;
  @name("Province") province?: Questions.Types.AddressParts.Province;
  @name("ZipPostalCode") zipPostalCode?: Questions.Types.AddressParts.ZipCode;
}

@ns(Namespaces.globLib)
model HumanName {
  @name("PrefixName") prefixName?: Questions.People.NameParts.Prefix;
  @name("FirstName") firstName: Questions.People.NameParts.FirstName;
  @name("MiddleName") middleName?: Questions.People.NameParts.MiddleName;
  @name("LastName") lastName: Questions.People.NameParts.LastName;
  @name("SuffixName") suffixName?: Questions.People.NameParts.Suffix;
}
