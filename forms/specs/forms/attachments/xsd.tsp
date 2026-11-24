import "./form.tsp";
import "#mapping/targets.tsp";
import "simpler-forms";
import "@typespec/xml";
import "form-library-xml";
import "#xsd/attachments.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.ApplicationAttachments;

alias Form = Forms.ApplicationAttachments.ApplicationAttachments;

@nsDeclarations
enum Namespaces {
  AttachmentForm_1_2: "http://apply.grants.gov/forms/AttachmentForm_1_2-V1.2",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
}

@name("AttachmentForm_1_2")
@ns(Namespaces.AttachmentForm_1_2)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/AttachmentForm_1_2-V1.2.xsd")
@Mapping.from(Mappings.Target.grantsGovXml, Form)
model Root {
  @name("ATT1")
  slot1?: AttachmentSlot<"ATT1File", Form.att1>;

  @name("ATT2")
  slot2?: AttachmentSlot<"ATT2File", Form.att2>;

  @name("ATT3")
  slot3?: AttachmentSlot<"ATT3File", Form.att3>;

  @name("ATT4")
  slot4?: AttachmentSlot<"ATT4File", Form.att4>;

  @name("ATT5")
  slot5?: AttachmentSlot<"ATT5File", Form.att5>;

  @name("ATT6")
  slot6?: AttachmentSlot<"ATT6File", Form.att6>;

  @name("ATT7")
  slot7?: AttachmentSlot<"ATT7File", Form.att7>;

  @name("ATT8")
  slot8?: AttachmentSlot<"ATT8File", Form.att8>;

  @name("ATT9")
  slot9?: AttachmentSlot<"ATT9File", Form.att9>;

  @name("ATT10")
  slot10?: AttachmentSlot<"ATT10File", Form.att10>;

  @name("ATT11")
  slot11?: AttachmentSlot<"ATT11File", Form.att11>;

  @name("ATT12")
  slot12?: AttachmentSlot<"ATT12File", Form.att12>;

  @name("ATT13")
  slot13?: AttachmentSlot<"ATT13File", Form.att13>;

  @name("ATT14")
  slot14?: AttachmentSlot<"ATT14File", Form.att14>;

  @name("ATT15")
  slot15?: AttachmentSlot<"ATT15File", Form.att15>;

  @attribute @name("FormVersion") formVersion: "1.2";
}

// All fifteen slots have this source shape; only the element name differs.
@ns(Namespaces.AttachmentForm_1_2)
model AttachmentSlot<
  FileElement extends valueof string,
  Source extends TypeSpec.Reflection.ModelProperty
> {
  @Mapping.from(Mappings.Target.grantsGovXml, Source)
  @name(FileElement)
  file: Att.AttachedFileDataType;
}
