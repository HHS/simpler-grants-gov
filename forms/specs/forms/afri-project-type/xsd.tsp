// Original XSD structure only; XML generator/emitter strategy is outside this definition slice.
// No active Mapping.from declarations or alternate XML adapter.
import "@typespec/xml";
import "form-library-xml";
using TypeSpec.Xml;
namespace XSD.AfriProjectType;

@nsDeclarations
enum Namespaces {
  AFRI_Project_Type_2_0: "http://apply.grants.gov/forms/AFRI_Project_Type_2_0-V2.0",
}

@name("AFRI_Project_Type_2_0")
@ns(Namespaces.AFRI_Project_Type_2_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/AFRI_Project_Type_2_0-V2.0.xsd")
model Root {
  @name("ProjectType")
  projectType: ProjectType;

  @name("GrantType_Group")
  grant: GrantTypeGroup;

  @attribute @name("FormVersion") formVersion: "2.0";
}

@ns(Namespaces.AFRI_Project_Type_2_0)
model GrantTypeGroup {
  @name("GrantType") type: GrantType;
  @name("FASEType") faseType?: FaseType;
  @name("StrengtheningType") strengtheningType?: StrengtheningType;

  @name("OtherDescription")
  @minLength(0)
  @maxLength(60)
  otherDescription?: string;
}

enum ProjectType {
  Research: "Research",
  Education: "Education",
  Extension: "Extension",
  Integrated: "Integrated",
}

enum GrantType {
  Standard: "Standard",
  CoordinatedAgriculturalProjectCAP: "Coordinated Agricultural Project (CAP)",
  PlanningCoordination: "Planning / Coordination",
  Conference: "Conference",
  FoodandAgricultureScienceEnhancementFASE: "Food and Agriculture Science Enhancement (FASE)",
  Other: "Other",
}

enum FaseType {
  PredoctoralFellowship: "Predoctoral Fellowship",
  PostdoctoralFellowship: "Postdoctoral Fellowship",
  NewInvestigatorSeed: "New Investigator Seed",
  NewInvestigatorStandard: "New Investigator Standard",
  Strengthening: "Strengthening",
}

enum StrengtheningType {
  Sabbatical: "Sabbatical",
  Equipment: "Equipment",
  NewInvestigatorStrengtheningSeed: "New Investigator Strengthening Seed",
  NewInvestigatorStrengtheningStandard: "New Investigator Strengthening Standard",
  StrengtheningSeed: "Strengthening Seed",
  StrengtheningStandard: "Strengthening Standard",
  StrengtheningCAP: "Strengthening CAP",
  StrengtheningConference: "Strengthening Conference",
}
