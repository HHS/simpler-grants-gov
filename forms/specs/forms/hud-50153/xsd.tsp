// Inactive original XSD shape; no Mapping.from or serializer strategy.
import "@typespec/xml";
import "form-library-xml";
using TypeSpec.Xml;
namespace XSD.HUD50153;
@nsDeclarations
enum Namespaces {
  n0: "http://apply.grants.gov/forms/HUD_50153-V1.0",
  n1: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  n2: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}

@ns(Namespaces.n1)
model HumanNameDataType {
  @name("PrefixName") prefixName?: string;
  @name("FirstName") firstName: string;
  @name("MiddleName") middleName?: string;
  @name("LastName") lastName: string;
  @name("SuffixName") suffixName?: string;
}

@name("HUD_50153")
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/HUD_50153-V1.0.xsd")
@ns(Namespaces.n0)
model Root {
  @name("OrganizationName") organizationName: string;
  @name("AssistanceListingNumber") assistanceListingNumber?: string;
  @name("AssistanceListingTitle") assistanceListingTitle?: string;
  @name("DesignatedCommunity") designatedCommunity: string;
  @name("GeographicCriteria") geographicCriteria: string;

  @name("AuthorizedRepresentativeName")
  authorizedRepresentativeName: HumanNameDataType;

  @name("AuthorizedRepresentativeTitle") authorizedRepresentativeTitle: string;

  @name("AuthorizedRepresentativeOrganization")
  authorizedRepresentativeOrganization: string;

  @name("AuthorizedRepresentativeSignature")
  authorizedRepresentativeSignature: string;

  @name("SignatureDate") signatureDate: plainDate;
  @attribute @name("FormVersion") formVersion: "1.0";
}
