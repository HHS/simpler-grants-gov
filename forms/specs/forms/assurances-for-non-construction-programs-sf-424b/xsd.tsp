// Exact original source structure only. No active Mapping.from: generated XML requires
// the global FormVersionIdentifier envelope and a flat-answer representative wrapper.
// Existing SGG XML rules are the separately tested integration reference.
import "@typespec/xml";
import "form-library-xml";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.SF424B;
@nsDeclarations
enum Namespaces {
  SF424B: "http://apply.grants.gov/forms/SF424B-V1.1",
  glob: "http://apply.grants.gov/system/Global-V1.0",
}

@name("Assurances")
@ns(Namespaces.SF424B)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/SF424B-V1.1.xsd")
model Root {
  @name("FormVersionIdentifier")
  @ns(Namespaces.glob)
  @minLength(1)
  @maxLength(30)
  formVersionIdentifier: string;

  @name("AuthorizedRepresentative")
  authorizedRepresentative?: AuthorizedRepresentative;

  @name("ApplicantOrganizationName")
  @minLength(1)
  @maxLength(60)
  applicantOrganizationName?: string;

  @name("SubmittedDate") submittedDate?: plainDate;

  @attribute
  @name("programType")
  @ns(Namespaces.SF424B)
  programType: "Non-Construction";

  @attribute
  @name("coreSchemaVersion")
  @ns(Namespaces.glob)
  coreSchemaVersion: "1.1";
}
@ns(Namespaces.SF424B)
model AuthorizedRepresentative {
  @name("RepresentativeName")
  @minLength(1)
  @maxLength(144)
  representativeName?: string;

  @name("RepresentativeTitle")
  @minLength(1)
  @maxLength(45)
  representativeTitle?: string;
}
