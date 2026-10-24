import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "#xsd/global-library.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.USDAAD1047;
alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.USDAAD1047.Certification;
@nsDeclarations
enum Namespaces {
  AD_1047: "http://apply.grants.gov/forms/AD_1047-V1.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}
@name("AD_1047")
@ns(Namespaces.AD_1047)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/AD_1047-V1.0.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @Mapping.from(grantsGovXml, Form.organizationName)
  @name("OrganizationName")
  organizationName: string;

  @Mapping.from(grantsGovXml, Form.projectName)
  @name("ProjectName")
  projectName: string;

  @Mapping.from(grantsGovXml, Form.authorizedRepresentative)
  @name("AuthorizedRepresentative")
  authorizedRepresentative: XSD.GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, Form.title) @name("Title") title: string;

  @Mapping.from(grantsGovXml, Form.aorSignature)
  @name("AORSignature")
  aorSignature: string;

  @Mapping.from(grantsGovXml, Form.dateSigned)
  @name("DateSigned")
  dateSigned: plainDate;

  @attribute @name("FormVersion") formVersion: "1.0";
}
