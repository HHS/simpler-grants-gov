// Inactive original XSD shape; no Mapping.from or serializer strategy.
import "@typespec/xml";
import "form-library-xml";
using TypeSpec.Xml;
namespace XSD.FRAF30;
@nsDeclarations
enum Namespaces {
  n0: "http://apply.grants.gov/system/Global-V1.0",
  n1: "http://apply.grants.gov/system/UniversalCodes-V2.0",
  n2: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  n3: "http://apply.grants.gov/forms/FRA-V1.0",
}

@ns(Namespaces.n3)
model RootAuthorizedRepresentative {
  @name("Signature") signature: string;
  @name("NameandTitle") nameandTitle: string;
}

@name("FRA")
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/FRA-V1.0.xsd")
@ns(Namespaces.n3)
model Root {
  @name("PlaceofPerformance1") placeofPerformance1?: string;
  @name("PlaceofPerformance2") placeofPerformance2?: string;
  @name("PlaceofPerformance3") placeofPerformance3?: string;
  @name("WorkplacesNotIdentified") workplacesNotIdentified?: string;
  @name("CheckExceeding") checkExceeding?: string;

  @name("AuthorizedRepresentative")
  authorizedRepresentative: RootAuthorizedRepresentative;

  @name("DateSigned") dateSigned: plainDate;
  @attribute @name("FormVersion") formVersion: "1.0";
}
