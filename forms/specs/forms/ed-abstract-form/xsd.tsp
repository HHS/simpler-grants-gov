// Source XSD structure only. Attachment XML export needs file metadata and wrapper
// support; do not emit a transform that serializes a UUID as an attached-file descriptor.
import "@typespec/xml";
import "form-library-xml";
import "#xsd/attachments.tsp";
using TypeSpec.Xml;
namespace XSD.EDAbstract;
@nsDeclarations
enum Namespaces {
  AbstractAttachments: "http://apply.grants.gov/forms/ED_Abstract-V1.1",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

@name("AbstractAttachments")
@ns(Namespaces.AbstractAttachments)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/ED_Abstract-V1.1.xsd")
model Root {
  @name("Attachments")
  attachment: Att.AttachedFileDataType;

  @attribute @name("FormVersion") formVersion: "1.1";
}
