import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "#xsd/attachments.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.Phs398ResearchTrainingProgramPlan;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.Phs398ResearchTrainingProgramPlan.Phs398ResearchTrainingProgramPlan;

@nsDeclarations
enum Namespaces {
  PHS398_ResearchTrainingProgramPlan_5_0: "http://apply.grants.gov/forms/PHS398_ResearchTrainingProgramPlan_5_0-V5.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

@name("PHS398_ResearchTrainingProgramPlan_5_0")
@ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/PHS398_ResearchTrainingProgramPlan_5_0-V5.0.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @name("ResearchTrainingProgramPlanAttachments")
  researchTrainingProgramPlanAttachments: ResearchTrainingProgramPlanAttachments;

  @attribute @name("FormVersion") formVersion: "5.0";
}

@ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
model ResearchTrainingProgramPlanAttachments {
  @name("IntroductionToApplication")
  introductionToApplication?: {
    @ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.introductionToApplication)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("ProgramPlan")
  programPlan: {
    @ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.programPlan)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("ResponsibleConductOfResearch")
  responsibleConductOfResearch?: {
    @ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.responsibleConductOfResearch)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("MethodsForEnhancingReproducibility")
  methodsForEnhancingReproducibility?: {
    @ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.methodsForEnhancingReproducibility)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("MultiplePDPILeadershipPlan")
  multiplePdPiLeadershipPlan?: {
    @ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.multiplePdPiLeadershipPlan)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("ProgressReport")
  progressReport?: {
    @ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.progressReport)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("ParticipatingFacultyBiosketches")
  participatingFacultyBiosketches?: {
    @ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.participatingFacultyBiosketches)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("LettersOfSupport")
  lettersOfSupport?: {
    @ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.lettersOfSupport)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("DataTables")
  dataTables?: {
    @ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.dataTables)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("VertebrateAnimals")
  vertebrateAnimals?: {
    @ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.vertebrateAnimals)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("SelectAgentResearch")
  selectAgentResearch?: {
    @ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.selectAgentResearch)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("ConsortiumContractualArrangements")
  consortiumContractualArrangements?: {
    @ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.consortiumContractualArrangements)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("OtherPlans")
  otherPlans?: {
    @ns(Namespaces.PHS398_ResearchTrainingProgramPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.otherPlans)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("Appendix")
  appendix?: Appendix;
}

@ns(Namespaces.att)
model Appendix {
  @name("AttachedFile")
  @Mapping.from(grantsGovXml, Form.appendix)
  @maxItems(100)
  attachedFile: XSD.Att.AttachedFileDataType[];
}
