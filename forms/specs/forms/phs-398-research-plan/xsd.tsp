// Source structure only. No active Mapping.from decorators: UUID answers cannot
// supply the source file descriptor, collection wrappers or external context.
import "@typespec/xml";
import "form-library-xml";
import "#xsd/attachments.tsp";
using TypeSpec.Xml;
namespace XSD.Phs398ResearchPlan;

@nsDeclarations
enum Namespaces {
  PHS398_ResearchPlan_5_0: "http://apply.grants.gov/forms/PHS398_ResearchPlan_5_0-V5.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

@name("PHS398_ResearchPlan_5_0")
@ns(Namespaces.PHS398_ResearchPlan_5_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/PHS398_ResearchPlan_5_0-V5.0.xsd")
model Root {
  @name("ResearchPlanAttachments")
  researchPlanAttachments: ResearchPlanAttachments;

  @attribute @name("FormVersion") formVersion: "5.0";
}

@ns(Namespaces.PHS398_ResearchPlan_5_0)
model ResearchPlanAttachments {
  @name("IntroductionToApplication")
  introductionToApplication?: Document;

  @name("SpecificAims")
  specificAims?: Document;

  @name("ResearchStrategy")
  researchStrategy: Document;

  @name("ProgressReportPublicationList")
  progressReportPublicationList?: Document;

  @name("VertebrateAnimals")
  vertebrateAnimals?: Document;

  @name("SelectAgentResearch")
  selectAgentResearch?: Document;

  @name("MultiplePDPILeadershipPlan")
  multiplePdPiLeadershipPlan?: Document;

  @name("ConsortiumContractualArrangements")
  consortiumContractualArrangements?: Document;

  @name("LettersOfSupport")
  lettersOfSupport?: Document;

  @name("ResourceSharingPlans")
  resourceSharingPlans?: Document;

  @name("OtherPlans")
  otherPlans?: Document;

  @name("KeyBiologicalAndOrChemicalResources")
  authenticationOfKeyBiologicalAndOrChemicalResources?: Document;

  @name("Appendix")
  appendix?: Appendix;
}

@ns(Namespaces.PHS398_ResearchPlan_5_0)
model Document {
  @name("attFile")
  attFile: Att.AttachedFileDataType;
}

@ns(Namespaces.att)
model Appendix {
  @name("AttachedFile")
  @minItems(0)
  @maxItems(100)
  attachedFile: Att.AttachedFileDataType[];
}
