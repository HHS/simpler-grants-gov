// Source XSD structure only. Attachment XML export needs file metadata and wrapper
// support; do not emit a transform that serializes a UUID as an attached-file descriptor.
import "@typespec/xml";
import "form-library-xml";
import "#xsd/attachments.tsp";
using TypeSpec.Xml;
namespace XSD.ApplicationAttachments;
@nsDeclarations
enum Namespaces {
  AttachmentForm_1_2: "http://apply.grants.gov/forms/AttachmentForm_1_2-V1.2",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

@name("AttachmentForm_1_2")
@ns(Namespaces.AttachmentForm_1_2)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/AttachmentForm_1_2-V1.2.xsd")
model Root {
  @name("ATT1")
  slot1?: AttachmentSlot<"ATT1File">;

  @name("ATT2")
  slot2?: AttachmentSlot<"ATT2File">;

  @name("ATT3")
  slot3?: AttachmentSlot<"ATT3File">;

  @name("ATT4")
  slot4?: AttachmentSlot<"ATT4File">;

  @name("ATT5")
  slot5?: AttachmentSlot<"ATT5File">;

  @name("ATT6")
  slot6?: AttachmentSlot<"ATT6File">;

  @name("ATT7")
  slot7?: AttachmentSlot<"ATT7File">;

  @name("ATT8")
  slot8?: AttachmentSlot<"ATT8File">;

  @name("ATT9")
  slot9?: AttachmentSlot<"ATT9File">;

  @name("ATT10")
  slot10?: AttachmentSlot<"ATT10File">;

  @name("ATT11")
  slot11?: AttachmentSlot<"ATT11File">;

  @name("ATT12")
  slot12?: AttachmentSlot<"ATT12File">;

  @name("ATT13")
  slot13?: AttachmentSlot<"ATT13File">;

  @name("ATT14")
  slot14?: AttachmentSlot<"ATT14File">;

  @name("ATT15")
  slot15?: AttachmentSlot<"ATT15File">;

  @attribute @name("FormVersion") formVersion: "1.2";
}

// All fifteen slots have this source shape; only the element name differs.
@ns(Namespaces.AttachmentForm_1_2)
model AttachmentSlot<FileElement extends valueof string> {
  @name(FileElement) file: Att.AttachedFileDataType;
}
