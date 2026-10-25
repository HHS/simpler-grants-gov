// Inactive original XSD shape; no Mapping.from or serializer strategy.
import "@typespec/xml";
import "form-library-xml";
using TypeSpec.Xml;
namespace XSD.IRS14335;
@nsDeclarations
enum Namespaces {
  n0: "http://apply.grants.gov/system/UniversalCodes-V2.0",
  n1: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  n2: "http://apply.grants.gov/forms/Form_14335_2_0-V2.0",
}

@ns(Namespaces.n2)
model RootOrganizationAddress {
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
model RootPrimaryContact {
  @name("POCName") pOCName: HumanNameDataType;
  @name("Title") title: string;
  @name("PhoneNumber") phoneNumber: string;
  @name("CellNumber") cellNumber?: string;
  @name("Email") email: string;
  @name("SharePrimaryContact") sharePrimaryContact: string;
}

@ns(Namespaces.n2)
model RootAlternateContact {
  @name("POCName") pOCName: HumanNameDataType;
  @name("Title") title: string;
  @name("PhoneNumber") phoneNumber: string;
  @name("CellNumber") cellNumber?: string;
  @name("Email") email: string;
  @name("ShareAlternateContact") shareAlternateContact: string;
}

@ns(Namespaces.n2)
model RootAOR {
  @name("POCName") pOCName: HumanNameDataType;
  @name("Title") title: string;
  @name("PhoneNumber") phoneNumber: string;
  @name("CellNumber") cellNumber?: string;
  @name("Email") email: string;

  @name("ShareAuthorizedOrganizationRepresentative")
  shareAuthorizedOrganizationRepresentative: string;
}

@ns(Namespaces.n2)
model RootFederalTaxMattersContact {
  @name("POCName") pOCName: HumanNameDataType;
  @name("Title") title: string;
  @name("PhoneNumber") phoneNumber: string;
  @name("CellNumber") cellNumber?: string;
  @name("Email") email: string;
}

@ns(Namespaces.n2)
model RootFinancialPMSContact {
  @name("POCName") pOCName: HumanNameDataType;
  @name("Title") title: string;
  @name("PhoneNumber") phoneNumber: string;
  @name("CellNumber") cellNumber?: string;
  @name("Email") email: string;
}

@ns(Namespaces.n2)
model Form_14335_2_0_OtherContact_DataType {
  @name("Role") role: string;
  @name("POCName") pOCName: HumanNameDataType;
  @name("Title") title: string;
  @name("PhoneNumber") phoneNumber: string;
  @name("CellNumber") cellNumber?: string;
  @name("Email") email: string;
  @name("ShareOtherContact") shareOtherContact: string;
}

@name("Form_14335_2_0")
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/Form_14335_2_0-V2.0.xsd")
@ns(Namespaces.n2)
model Root {
  @name("OrganizationName") organizationName: string;
  @name("FederalAwardIdentifier") federalAwardIdentifier?: string;
  @name("OrganizationAddress") organizationAddress: RootOrganizationAddress;
  @name("DaysOperation") daysOperation: string;
  @name("HoursOperation") hoursOperation: string;
  @name("PrimaryContact") primaryContact: RootPrimaryContact;
  @name("AlternateContact") alternateContact: RootAlternateContact;
  @name("AOR") aOR: RootAOR;

  @name("FederalTaxMattersContact")
  federalTaxMattersContact: RootFederalTaxMattersContact;

  @name("FinancialPMSContact") financialPMSContact: RootFinancialPMSContact;
  @name("OtherContact1") otherContact1?: Form_14335_2_0_OtherContact_DataType;
  @name("OtherContact2") otherContact2?: Form_14335_2_0_OtherContact_DataType;
  @name("OtherContact3") otherContact3?: Form_14335_2_0_OtherContact_DataType;
  @attribute @name("FormVersion") formVersion: "2.0";
}
