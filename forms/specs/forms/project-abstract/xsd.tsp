import "@typespec/xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "./form.tsp";
import "form-library-xml";
import "#xsd/attachments.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.ProjectAbstract12;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias ProjectAbstract = Forms.ProjectAbstract.ProjectAbstract;
@nsDeclarations
enum Namespaces {
  Project_Abstract_1_2: "http://apply.grants.gov/forms/Project_Abstract_1_2-V1.2",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

@name("Project_Abstract_1_2")
@ns(Namespaces.Project_Abstract_1_2)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/Project_Abstract_1_2-V1.2.xsd")
@Mapping.from(grantsGovXml, ProjectAbstract)
model Root {
  @name("ProjectAbstractAddAttachment")
  projectAbstractAddAttachment: File;

  @attribute @name("FormVersion") formVersion: "1.2";
}

@ns(Namespaces.Project_Abstract_1_2)
model File {
  @Mapping.from(grantsGovXml, ProjectAbstract.attachment)
  @name("AttachedFile")
  attachment: XSD.Att.AttachedFileDataType;
}
