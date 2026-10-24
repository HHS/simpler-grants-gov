import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.EdEvidence20;
alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Evidence = Forms.Evidence.Evidence;
alias Citation = Forms.Evidence.Citation;

@nsDeclarations
enum Namespaces {
  ED_Evidence_2_0: "http://apply.grants.gov/forms/ED_Evidence_2_0-V2.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
}

@name("ED_Evidence_2_0")
@ns(Namespaces.ED_Evidence_2_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/ED_Evidence_2_0-V2.0.xsd")
@Mapping.from(grantsGovXml, Evidence)
model Root {
  @name("LevelofEvidence")
  @Mapping.from(grantsGovXml, Evidence.levelOfEvidence)
  levelOfEvidence: Forms.Evidence.EvidenceLevel;

  @name("Citations")
  @Mapping.from(grantsGovXml, Evidence.citations)
  @minItems(1)
  @maxItems(100)
  citations: Study[];

  @attribute @name("FormVersion") formVersion: "2.0";
}

@ns(Namespaces.ED_Evidence_2_0)
model Study {
  @name("Citation")
  @Mapping.from(grantsGovXml, Citation.citation)
  citation: Forms.Evidence.CitationText;

  @name("RelevantFindings")
  @Mapping.from(grantsGovXml, Citation.relevantFindings)
  relevantFindings: Forms.Evidence.CitationText;

  @name("OverlapofPopulations")
  @Mapping.from(grantsGovXml, Citation.overlapOfPopulations)
  overlapOfPopulations: Forms.Evidence.CitationText;
}
