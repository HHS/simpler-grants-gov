// Source structure only. No active Mapping.from decorators: UUID answers cannot
// supply the source file descriptor, collection wrappers or external context.
import "@typespec/xml";
import "form-library-xml";
import "#xsd/attachments.tsp";
using TypeSpec.Xml;
namespace XSD.Phs398ResearchTrainingProgramPlan;

@nsDeclarations
enum Namespaces {
  PHS398_ResearchTrainingProgramPlan_5_0: "http://apply.grants.gov/forms/PHS398_ResearchTrainingProgramPlan_5_0-V5.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

@name("PHS398_ResearchTrainingProgramPlan_5_0")
@ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/PHS398_ResearchTrainingProgramPlan_5_0-V5.0.xsd")
model Root {
  @name("ResearchTrainingProgramPlanAttachments")
  researchTrainingProgramPlanAttachments: ResearchTrainingProgramPlanAttachments;

  @attribute @name("FormVersion") formVersion: "5.0";
}

@ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
model ResearchTrainingProgramPlanAttachments {
  @name("IntroductionToApplication")
  introductionToApplication?: Document;

  @name("ProgramPlan")
  programPlan: Document;

  @name("ResponsibleConductOfResearch")
  responsibleConductOfResearch?: Document;

  @name("MethodsForEnhancingReproducibility")
  methodsForEnhancingReproducibility?: Document;

  @name("MultiplePDPILeadershipPlan")
  multiplePdPiLeadershipPlan?: Document;

  @name("ProgressReport")
  progressReport?: Document;

  @name("ParticipatingFacultyBiosketches")
  participatingFacultyBiosketches?: Document;

  @name("LettersOfSupport")
  lettersOfSupport?: Document;

  @name("DataTables")
  dataTables?: Document;

  @name("VertebrateAnimals")
  vertebrateAnimals?: Document;

  @name("SelectAgentResearch")
  selectAgentResearch?: Document;

  @name("ConsortiumContractualArrangements")
  consortiumContractualArrangements?: Document;

  @name("OtherPlans")
  otherPlans?: Document;

  @name("Appendix")
  appendix?: Appendix;
}

@ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
model Document {
  @name("attFile")
  file: Att.AttachedFileDataType;
}

@ns(Namespaces.att)
model Appendix {
  @name("AttachedFile")
  @minItems(0)
  @maxItems(100)
  attachedFile: Att.AttachedFileDataType[];
}
