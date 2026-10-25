// Inactive original XSD shape; no Mapping.from or serializer strategy.
import "@typespec/xml";
import "form-library-xml";
using TypeSpec.Xml;
namespace XSD.HUDOZ;
@nsDeclarations
enum Namespaces {
  n0: "http://apply.grants.gov/forms/OZ_Certification_Form-V1.0",
  n1: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  n2: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}

@ns(Namespaces.n0)
model RootProjectPurpose {
  @name("AccessToCapital") accessToCapital?: string;
  @name("AssetBuilding") assetBuilding?: string;
  @name("BusinessAssistance") businessAssistance?: string;
  @name("CommunityCapacityBuilding") communityCapacityBuilding?: string;
  @name("EconomicDevelopment") economicDevelopment?: string;
  @name("Education") education?: string;
  @name("HealthyFoodAccess") healthyFoodAccess?: string;
  @name("Health") health?: string;
  @name("Housing") housing?: string;
  @name("HumanServicesandFamilySupport") humanServicesandFamilySupport?: string;
  @name("CommunityInfrastructure") communityInfrastructure?: string;
  @name("PublicSafety") publicSafety?: string;
  @name("WorkforceDevelopment") workforceDevelopment?: string;
  @name("LIHTC") lIHTC?: string;
  @name("MarketRateHousing") marketRateHousing?: string;
  @name("IndustrialDevelopment") industrialDevelopment?: string;
  @name("CommercialDevelopment") commercialDevelopment?: string;
  @name("OtherBusinessDevelopment") otherBusinessDevelopment?: string;
  @name("AboveGroundInfrastructure") aboveGroundInfrastructure?: string;
  @name("BelowGroundInfrastructure") belowGroundInfrastructure?: string;
  @name("Schools") schools?: string;
  @name("Hospitals") hospitals?: string;
}

@ns(Namespaces.n1)
model HumanNameDataType {
  @name("PrefixName") prefixName?: string;
  @name("FirstName") firstName: string;
  @name("MiddleName") middleName?: string;
  @name("LastName") lastName: string;
  @name("SuffixName") suffixName?: string;
}

@name("OZ_Certification_Form")
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/OZ_Certification_Form-V1.0.xsd")
@ns(Namespaces.n0)
model Root {
  @name("OrganizationName") organizationName: string;
  @name("FederalProgram") federalProgram?: string;
  @name("OZCensusTracts") oZCensusTracts: string;
  @name("ApplicationCriteria") applicationCriteria: string;
  @name("EstimatedFundingAllocations") estimatedFundingAllocations: string;
  @name("Narrative") narrative?: string;
  @name("ProjectPurpose") projectPurpose?: RootProjectPurpose;
  @name("AuthorizedRepresentative") authorizedRepresentative: HumanNameDataType;
  @name("AuthorizedRepresentativeTitle") authorizedRepresentativeTitle: string;

  @name("AuthorizedRepresentativeOrganization")
  authorizedRepresentativeOrganization: string;

  @name("AuthorizedRepresentativeSignature")
  authorizedRepresentativeSignature: string;

  @name("SignatureDate") signatureDate: plainDate;
  @attribute @name("FormVersion") formVersion: "1.0";
}
