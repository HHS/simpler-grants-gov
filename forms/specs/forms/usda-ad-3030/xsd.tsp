import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.USDAAD3030;
alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.USDAAD3030.Representations;
@nsDeclarations
enum Namespaces {
  AD_3030_2_0: "http://apply.grants.gov/forms/AD_3030_2_0-V2.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}
@name("AD_3030_2_0")
@ns(Namespaces.AD_3030_2_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/AD_3030_2_0-V2.0.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @Mapping.from(grantsGovXml, Form.applicantName)
  @name("ApplicantName")
  applicantName: string;

  @Mapping.from(grantsGovXml, Form.applicantAddress)
  @name("ApplicantAddress")
  applicantAddress: string;

  @Mapping.from(grantsGovXml, Form.taxIdNumber)
  @name("TaxIDNumber")
  taxIdNumber: string;

  @Mapping.from(grantsGovXml, Form.applicantFelony)
  @name("ApplicantFelony")
  applicantFelony: Forms.USDAAD3030.YesNo;

  @Mapping.from(grantsGovXml, Form.unpaidFederalTax)
  @name("UnpaidFederalTax")
  unpaidFederalTax: Forms.USDAAD3030.YesNo;

  @Mapping.from(grantsGovXml, Form.aorSignature)
  @name("AORSignature")
  aorSignature: string;

  @Mapping.from(grantsGovXml, Form.title) @name("Title") title: string;

  @Mapping.from(grantsGovXml, Form.dateSigned)
  @name("DateSigned")
  dateSigned: plainDate;

  @attribute @name("FormVersion") formVersion: "2.0";
}
