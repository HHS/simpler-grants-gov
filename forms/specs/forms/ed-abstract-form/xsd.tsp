import "@typespec/xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "./form.tsp";
import "form-library-xml";
import "#xsd/attachments.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.EDAbstract;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias EDAbstract = Forms.EDAbstract.EDAbstract;
@nsDeclarations
enum Namespaces {
  AbstractAttachments: "http://apply.grants.gov/forms/ED_Abstract-V1.1",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

@name("AbstractAttachments")
@ns(Namespaces.AbstractAttachments)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/ED_Abstract-V1.1.xsd")
@Mapping.from(grantsGovXml, EDAbstract)
model Root {
  @Mapping.from(grantsGovXml, EDAbstract.attachment)
  @name("Attachments")
  attachment: XSD.Att.AttachedFileDataType;

  @attribute @name("FormVersion") formVersion: "1.1";
}
