// Exact original source structure only. No active Mapping.from or Sgg.sync.
// Boolean-to-source Yes/No conversion and ApplicantInfo grouping remain integration work.
import "@typespec/xml";
import "form-library-xml";
import "#questions/types/codes.tsp";
import "#questions/types/yes-no.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.EPA47004;
@nsDeclarations
enum Namespaces {
  EPA4700_4_5_0: "http://apply.grants.gov/forms/EPA4700_4_5_0-V5.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}
@name("EPA4700_4_5_0")
@ns(Namespaces.EPA4700_4_5_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/EPA4700_4_5_0-V5.0.xsd")
model Root {
  @name("ApplicantInfo") applicantInfo: ApplicantInfo;

  @name("SAMUEI")
  @minLength(12)
  @maxLength(12)
  samUei: string;

  @name("POCName")
  @minLength(1)
  @maxLength(100)
  pocName: string;

  @name("Phone")
  @minLength(1)
  @maxLength(25)
  phone: string;

  @name("Email")
  @minLength(1)
  @maxLength(60)
  email: string;

  @name("Title")
  @minLength(1)
  @maxLength(45)
  title: string;

  @name("FederalFinancialAssistanceQuestion")
  federalFinancialAssistance?: Questions.Types.YesNo;

  @name("CivilRightsLawSuits1")
  @minLength(0)
  @maxLength(4000)
  civilRightsLawsuitQuestion1?: string;

  @name("CivilRightsLawSuits2")
  @minLength(0)
  @maxLength(4000)
  civilRightsLawsuitQuestion2?: string;

  @name("CivilRightsLawSuits3")
  @minLength(0)
  @maxLength(4000)
  civilRightsLawsuitQuestion3?: string;

  @name("ConstructionFederalAssistance")
  constructionFederalAssistance?: Questions.Types.YesNo;

  @name("Construction") constructionNewFacilities?: Questions.Types.YesNo;

  @name("Construction2")
  @minLength(0)
  @maxLength(500)
  constructionNewFacilitiesExplanation?: string;

  @name("Notice1") notice1?: Questions.Types.YesNo;
  @name("Notice2") notice2?: Questions.Types.YesNo;
  @name("Notice3") notice3?: Questions.Types.YesNo;
  @name("Notice4") notice4?: Questions.Types.YesNo;
  @name("Demographic") demographicData?: Questions.Types.YesNo;
  @name("Policy1") policy?: Questions.Types.YesNo;

  @name("Policy2")
  @minLength(0)
  @maxLength(1000)
  policyExplanation?: string;

  @name("Program")
  @minLength(0)
  @maxLength(1000)
  programExplanation?: string;

  @name("ApplicantSignature") applicantSignature: ApplicantSignature;

  @attribute
  @name("FormVersion")
  @ns(Namespaces.EPA4700_4_5_0)
  formVersion: "5.0";
}
@ns(Namespaces.EPA4700_4_5_0)
model ApplicantInfo {
  @name("ApplicantName")
  @minLength(1)
  @maxLength(60)
  applicantName: string;

  @name("ApplicantAddress") applicantAddress: ApplicantAddress;
}
@ns(Namespaces.EPA4700_4_5_0)
model ApplicantAddress {
  @name("Address")
  @minLength(0)
  @maxLength(110)
  address: string;

  @name("City")
  @minLength(1)
  @maxLength(35)
  city: string;

  @name("State") state: Questions.Types.StateCode;

  @name("ZipCode")
  @minLength(1)
  @maxLength(30)
  zipCode: string;
}
@ns(Namespaces.EPA4700_4_5_0)
model ApplicantSignature {
  @name("AORSignature")
  @minLength(1)
  @maxLength(144)
  aorSignature: string;

  @name("PersonTitle")
  @minLength(1)
  @maxLength(45)
  personTitle: string;

  @name("SubmittedDate") submittedDate: plainDate;
}
