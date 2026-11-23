import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "#xsd/attachments.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.OtherNarrative12;
alias grantsGovXml = Mappings.Target.grantsGovXml;
alias OtherNarrative = Forms.OtherNarrative.OtherNarrative;
@nsDeclarations
enum Namespaces {
  OtherNarrativeAttachments_1_2: "http://apply.grants.gov/forms/OtherNarrativeAttachments_1_2-V1.2",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
}
@name("OtherNarrativeAttachments_1_2")
@ns(Namespaces.OtherNarrativeAttachments_1_2)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/OtherNarrativeAttachments_1_2-V1.2.xsd")
@Mapping.from(grantsGovXml, OtherNarrative)
model Root {
  @name("Attachments")
  attachments: AttachmentGroup;

  @attribute @name("FormVersion") formVersion: "1.2";
}
@ns(Namespaces.att)
model AttachmentGroup {
  @name("AttachedFile")
  @Mapping.from(grantsGovXml, OtherNarrative.attachments)
  @minItems(1)
  @maxItems(100)
  attachedFile: XSD.Att.AttachedFileDataType[];
}
