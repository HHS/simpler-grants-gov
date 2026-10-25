// Original source shape only: no active Mapping.from or XML strategy.
import "@typespec/xml";
import "form-library-xml";
using TypeSpec.Xml;
namespace XSD.HUD424B;
@nsDeclarations
enum Namespaces {
  HUD_424B: "http://apply.grants.gov/forms/HUD_424B-V1.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
}
@name("HUD_424B")
@ns(Namespaces.HUD_424B)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/HUD_424B-V1.0.xsd")
model Root {
  @name("AuthorizedRepresentative") authorizedRepresentative: HumanName;
  @name("Title") title: string;
  @name("OrganizationName") organizationName: string;
  @name("Signature") signature: string;
  @name("DateSigned") dateSigned: plainDate;
  @attribute @name("FormVersion") formVersion: "1.0";
}
@ns(Namespaces.globLib)
model HumanName {
  @name("PrefixName") prefixName?: string;
  @name("FirstName") firstName: string;
  @name("MiddleName") middleName?: string;
  @name("LastName") lastName: string;
  @name("SuffixName") suffixName?: string;
}
