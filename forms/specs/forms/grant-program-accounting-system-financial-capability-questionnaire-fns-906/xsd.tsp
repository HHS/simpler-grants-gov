// Inactive original XSD shape; no Mapping.from or serializer strategy.
import "@typespec/xml";
import "form-library-xml";
using TypeSpec.Xml;
namespace XSD.FNS906;
@nsDeclarations
enum Namespaces {
  n0: "http://apply.grants.gov/forms/FNS_906-V1.0",
  n1: "http://apply.grants.gov/system/UniversalCodes-V2.0",
  n2: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
}

@ns(Namespaces.n2)
model HumanNameDataType {
  @name("PrefixName") prefixName?: string;
  @name("FirstName") firstName: string;
  @name("MiddleName") middleName?: string;
  @name("LastName") lastName: string;
  @name("SuffixName") suffixName?: string;
}

@name("FNS_906")
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/FNS_906-V1.0.xsd")
@ns(Namespaces.n0)
model Root {
  @name("OrganizationName") organizationName: string;
  @name("UEINumber") uEINumber: string;
  @name("FederalAward") federalAward: string;
  @name("AccountingSoftware") accountingSoftware: string;
  @name("ProgramFunds") programFunds: string;
  @name("DedicatedMonitoring") dedicatedMonitoring: string;
  @name("SeparateDuties") separateDuties: string;
  @name("AllocateEffort") allocateEffort: string;
  @name("ManagementSystem") managementSystem: string;
  @name("Audited") audited: string;
  @name("QualifiedOpinion") qualifiedOpinion?: string;
  @name("MaterialWeakness") materialWeakness?: string;
  @name("SignificantDeficiency") significantDeficiency?: string;
  @name("Hyperlink") hyperlink?: string;
  @name("AdditionalInformation") additionalInformation?: string;
  @name("Signature") signature: string;
  @name("SignatureDate") signatureDate: plainDate;
  @name("AuthorizedRepresentative") authorizedRepresentative: HumanNameDataType;
  @name("Phone") phone: string;
  @name("Email") email: string;
  @attribute @name("FormVersion") formVersion: "1.0";
}
