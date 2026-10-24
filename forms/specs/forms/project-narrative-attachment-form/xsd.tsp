// Source XSD structure only. Attachment XML export needs file metadata and wrapper
// support; do not emit a transform that serializes a UUID as an attached-file descriptor.
import "@typespec/xml";
import "form-library-xml";
import "#xsd/attachments.tsp";
using TypeSpec.Xml;
namespace XSD.ProjectNarrative;
@nsDeclarations
enum Namespaces {
  ProjectNarrativeAttachments_1_2: "http://apply.grants.gov/forms/ProjectNarrativeAttachments_1_2-V1.2",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

@name("ProjectNarrativeAttachments_1_2")
@ns(Namespaces.ProjectNarrativeAttachments_1_2)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/ProjectNarrativeAttachments_1_2-V1.2.xsd")
model Root {
  @name("Attachments")
  attachments: Files;

  @attribute @name("FormVersion") formVersion: "1.2";
}

@ns(Namespaces.att)
model Files {
  @name("AttachedFile")
  @minItems(1)
  @maxItems(100)
  attachments: Att.AttachedFileDataType[];
}
