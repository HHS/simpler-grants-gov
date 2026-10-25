// Inactive original XSD shape; no Mapping.from or serializer strategy.
import "@typespec/xml";
import "form-library-xml";
using TypeSpec.Xml;
namespace XSD.ACHSF3881;
@nsDeclarations
enum Namespaces {
  n0: "http://apply.grants.gov/system/Global-V1.0",
  n1: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  n2: "http://apply.grants.gov/forms/SF3881_2_0-V2.0",
  n3: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}

@ns(Namespaces.n1)
model AddressDataTypeV3 {
  @name("Street1") street1: string;
  @name("Street2") street2?: string;
  @name("City") city: string;
  @name("County") county?: string;
  @name("State") state?: string;
  @name("Province") province?: string;
  @name("ZipPostalCode") zipPostalCode?: string;
  @name("Country") country: string;
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
model RootPayee {
  @name("OrganizationName") organizationName: string;
  @name("SSNTIN") sSNTIN: string;
  @name("PayeeAddress") payeeAddress: AddressDataTypeV3;
  @name("ContactName") contactName: HumanNameDataType;
  @name("PhoneNumber") phoneNumber: string;
}

@ns(Namespaces.n2)
model RootFinancialInstitutionAOSignatureAndTitle {
  @name("AOName") aOName: HumanNameDataType;
  @name("AOTitle") aOTitle: string;
  @name("AOPhoneNumber") aOPhoneNumber: string;
}

@ns(Namespaces.n2)
model RootFinancialInstitution {
  @name("BankName") bankName: string;
  @name("BankAddress") bankAddress: AddressDataTypeV3;
  @name("ACHCoordinator") aCHCoordinator: HumanNameDataType;
  @name("PhoneNumber") phoneNumber: string;
  @name("NineDigitRoutingTransitNumber") nineDigitRoutingTransitNumber: string;
  @name("DepositorAccountTitle") depositorAccountTitle: string;
  @name("DepositorAccountNumber") depositorAccountNumber: string;
  @name("LockboxNumber") lockboxNumber?: string;
  @name("TypeofAccount") typeofAccount?: string;

  @name("AOSignatureAndTitle")
  aOSignatureAndTitle: RootFinancialInstitutionAOSignatureAndTitle;
}

@name("SF3881_2_0")
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/SF3881_2_0-V2.0.xsd")
@ns(Namespaces.n2)
model Root {
  @name("AgencyName") agencyName: string;
  @name("AgencyIdentifier") agencyIdentifier?: string;
  @name("AgencyLocation") agencyLocation?: string;
  @name("ACHFormat") aCHFormat?: string;
  @name("AgencyAddress") agencyAddress?: AddressDataTypeV3;
  @name("ContactPersonName") contactPersonName?: HumanNameDataType;
  @name("PhoneNumber") phoneNumber?: string;
  @name("AddedInfo") addedInfo?: string;
  @name("Payee") payee: RootPayee;
  @name("FinancialInstitution") financialInstitution: RootFinancialInstitution;
  @attribute @name("FormVersion") formVersion: "2.0";
}
