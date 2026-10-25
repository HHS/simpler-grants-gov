// Inactive original XSD shape; no Mapping.from or serializer strategy.
import "@typespec/xml";
import "form-library-xml";
using TypeSpec.Xml;
namespace XSD.IRSTCE14204;
@nsDeclarations
enum Namespaces {
  n0: "http://apply.grants.gov/system/UniversalCodes-V2.0",
  n1: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  n2: "http://apply.grants.gov/forms/Form_14204_2_0-V2.0",
}

@ns(Namespaces.n2)
model RootContactInformationOrganizationAddress {
  @name("Street1") street1: string;
  @name("Street2") street2?: string;
  @name("City") city: string;
  @name("State") state?: string;
  @name("Province") province?: string;
  @name("Country") country: string;
  @name("ZipPostalCode") zipPostalCode?: string;
}

@ns(Namespaces.n1)
model HumanNameDataType {
  @name("PrefixName") prefixName?: string;
  @name("FirstName") firstName: string;
  @name("MiddleName") middleName?: string;
  @name("LastName") lastName: string;
  @name("SuffixName") suffixName?: string;
}

@ns(Namespaces.n2)
model RootContactInformation {
  @name("OrganizationName") organizationName: string;

  @name("OrganizationAddress")
  organizationAddress: RootContactInformationOrganizationAddress;

  @name("PhoneNumber") phoneNumber: string;
  @name("Fax") fax?: string;
  @name("POCName") pOCName: HumanNameDataType;
  @name("Title") title?: string;
  @name("Email") email: string;
}

@ns(Namespaces.n2)
model RootAdministrativeInformation {
  @name("SAMRegistration") sAMRegistration: string;
  @name("MultiyearGrant") multiyearGrant: string;
  @name("CheckedEligible") checkedEligible?: string;
}

@ns(Namespaces.n2)
model RootApplicationChecklist {
  @name("Form14204") form14204: string;
  @name("BackgroundNarrative") backgroundNarrative: string;
  @name("NonprofitStatus") nonprofitStatus: string;
  @name("ExplanationFederalTax") explanationFederalTax?: string;
  @name("ProgramBudgetPlan") programBudgetPlan: string;
  @name("Form8653") form8653: string;
  @name("StandardForm424") standardForm424: string;
  @name("CivilRightsNarrative") civilRightsNarrative: string;
  @name("Form14335") form14335: string;
  @name("StandardFormLLL") standardFormLLL?: string;
}

@name("Form_14204_2_0")
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/Form_14204_2_0-V2.0.xsd")
@ns(Namespaces.n2)
model Root {
  @name("ContactInformation") contactInformation: RootContactInformation;

  @name("AdministrativeInformation")
  administrativeInformation: RootAdministrativeInformation;

  @name("ApplicationChecklist") applicationChecklist: RootApplicationChecklist;
  @attribute @name("FormVersion") formVersion: "2.0";
}
