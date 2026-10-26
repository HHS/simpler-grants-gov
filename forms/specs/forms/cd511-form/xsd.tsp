// Form-local mapping reuses the maintained emitter and HumanName type; no new XML strategy.
import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "#xsd/global-library.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.CD511;
alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.CD511.CD511;
alias GlobLib = XSD.GlobLib;

@nsDeclarations
enum Namespaces {
  CD511: "http://apply.grants.gov/forms/CD511-V1.1",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
}

@name("CD511")
@ns(Namespaces.CD511)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/CD511-V1.1.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @Mapping.from(grantsGovXml, Form.applicantName)
  @name("OrganizationName")
  applicantName: string;

  @Mapping.from(grantsGovXml, Form.awardNumber)
  @name("AwardNumber")
  awardNumber?: string;

  @Mapping.from(grantsGovXml, Form.projectName)
  @name("ProjectName")
  projectName?: string;

  @Mapping.from(grantsGovXml, Form.contactPerson)
  @name("ContactName")
  contactPerson?: GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, Form.contactPersonTitle)
  @name("Title")
  contactPersonTitle: string;

  @Mapping.from(grantsGovXml, Form.signature)
  @name("Signature")
  signature: string;

  @Mapping.from(grantsGovXml, Form.submittedDate)
  @name("SubmittedDate")
  submittedDate: plainDate;

  @attribute @name("FormVersion") formVersion: "1.1";
}
