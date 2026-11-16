import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "#xsd/attachments.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.ProjectNarrative12;
alias grantsGovXml = Mappings.Target.grantsGovXml;
alias ProjectNarrative = Forms.ProjectNarrative.ProjectNarrative;
@nsDeclarations
enum Namespaces {
  ProjectNarrativeAttachments_1_2: "http://apply.grants.gov/forms/ProjectNarrativeAttachments_1_2-V1.2",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
}
@name("ProjectNarrativeAttachments_1_2")
@ns(Namespaces.ProjectNarrativeAttachments_1_2)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/ProjectNarrativeAttachments_1_2-V1.2.xsd")
@Mapping.from(grantsGovXml, ProjectNarrative)
model Root {
  @name("Attachments")
  attachments: AttachmentGroup;

  @attribute @name("FormVersion") formVersion: "1.2";
}
@ns(Namespaces.att)
model AttachmentGroup {
  @name("AttachedFile")
  @Mapping.from(grantsGovXml, ProjectNarrative.attachments)
  @minItems(1)
  @maxItems(100)
  attachedFile: XSD.Att.AttachedFileDataType[];
}
