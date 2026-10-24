// Source XSD structure only. Attachment XML export needs file metadata and wrapper
// support; do not emit a transform that serializes a UUID as an attached-file descriptor.
import "@typespec/xml";
import "form-library-xml";
import "#xsd/attachments.tsp";
using TypeSpec.Xml;
namespace XSD.ProjectAbstract;
@nsDeclarations
enum Namespaces {
  Project_Abstract_1_2: "http://apply.grants.gov/forms/Project_Abstract_1_2-V1.2",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

@name("Project_Abstract_1_2")
@ns(Namespaces.Project_Abstract_1_2)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/Project_Abstract_1_2-V1.2.xsd")
model Root {
  @name("ProjectAbstractAddAttachment")
  projectAbstractAddAttachment: File;

  @attribute @name("FormVersion") formVersion: "1.2";
}

@ns(Namespaces.Project_Abstract_1_2)
model File {
  @name("AttachedFile")
  attachment: Att.AttachedFileDataType;
}
