import "simpler-forms";
using SimplerForms;
namespace Forms.AfriProjectType;

// These classification vocabularies are local to AFRI FID796/v2.0. Similar labels
// on other forms do not establish a shared semantic question.
enum ProjectType {
  @doc("Select this option for fundamental or mission-linked research that is conducted by individual investigators and/or co-investigators within the same discipline, or multidisciplinary teams.")
  Research: "Research",

  @doc("Select this option for applications that involve education activities.")
  Education: "Education",

  @doc("Select this option for applications that involve extension activities.")
  Extension: "Extension",

  @doc("Select this option for applications that may involve any combination of research, education, and extension activities, with the provision that every project must include at least two of the three stated components.")
  Integrated: "Integrated",
}

enum GrantType {
  @doc("Select this option for fundamental or mission-linked project that is conducted by individual investigators and/or co-investigators within the same discipline, or multidisciplinary teams.")
  Standard: "Standard",

  @doc("Select this option for fundamental or mission-linked project that is conducted by multiple institutions.")
  CoordinatedAgriculturalProjectCAP: "Coordinated Agricultural Project (CAP)",

  @doc("Select this option only if the program area priority specifically calls for this type of grant in preparation for submitting a Coordinated Agricultural Project grant application in a future year.")
  PlanningCoordination: "Planning / Coordination",

  @doc("Select this option for scientific meetings that bring together scientists to identify research needs, update information, or advance an area of research.")
  Conference: "Conference",

  @doc("Select this option for awards that are designed to help institutions develop competitive research programs and to attract new scientists into careers in high-priority areas of national need in agriculture, food, and environmental sciences. See full funding opportunity for specific details.")
  FoodandAgricultureScienceEnhancementFASE: "Food and Agriculture Science Enhancement (FASE)",

  @doc("Select this option for grant types that are not listed on the form.")
  Other: "Other",
}

enum FaseType {
  @doc("Select this option for research awards to individuals who will soon receive their doctoral degree. These applications may be submitted either directly by the individual or through the mentor's institution. See funding opportunity for details. ")
  PredoctoralFellowship: "Predoctoral Fellowship",

  @doc("Select this option for research awards to individuals who will soon receive their doctoral degree. These applications may be submitted either directly by the individual or through the mentor's institution. See funding opportunity for details.")
  PostdoctoralFellowship: "Postdoctoral Fellowship",

  @doc("Select this option for awards to provide funds to enable new investigators to collect preliminary data in preparation for applying for a Standard Research Grant. A new investigator is one who is beginning his/her research career, does not have an extensive research publication record, and has less than five years postgraduate, career-track research experience. The new investigator may not have received competitively awarded Federal research funds beyond pre- or postdoctoral research awards. ")
  NewInvestigatorSeed: "New Investigator Seed",

  @doc("A new investigator is one who is beginning his/her research career, does not have an extensive research publication record, and has less than five years postgraduate, career-track research experience. The new investigator may not have received competitively awarded Federal research funds beyond pre- or postdoctoral research awards or an AFRI seed grant. ")
  NewInvestigatorStandard: "New Investigator Standard",

  @doc("Select this option for Strengthening Awards consisting of Sabbatical, Equipment, Seed, Strengthening Standard and Strengthening CAP. ")
  Strengthening: "Strengthening",
}

enum StrengtheningType {
  @doc("Select this option for funds that will be designated for sabbatical grants to strengthen the research capacity of institutions. ")
  Sabbatical: "Sabbatical",

  @doc("Select this option for funds that will be designated for equipment grants to strengthen the research capacity of institutions. Only degree-granting institutions that are not among the most successful universities and colleges for receiving Federal funds for science and engineering research may apply.")
  Equipment: "Equipment",

  @doc("Select this option if you are elgible for both a new investigator seed grant and a strengthening seed grant. These awards  provide funds to enable new investigators to collect preliminary data in preparation for applying for a Standard Research Grant. These awards will be limited to new investigators who are faculty with appointments at small and mid-sized degree-granting institutions that have had limited institutional success and to faculty with appointments at degree-granting institutions eligible for USDA-EPSCoR funding. See the full funding opportunity for the definition of USDA EPSCoR and small and mid-sized institutions.")
  NewInvestigatorStrengtheningSeed: "New Investigator Strengthening Seed",

  @doc("Select this option if you are elgible for both a new investigator standard grant and a strengthening standard grant. These awards will be limited to new investigators who are faculty with appointments at small and mid-sized degree-granting institutions that have had limited institutional success and to faculty with appointments at degree-granting institutions eligible for USDA-EPSCoR funding. See the full funding opportunity for the definition of USDA EPSCoR and small and mid-sized institutions.")
  NewInvestigatorStrengtheningStandard: "New Investigator Strengthening Standard",

  @doc("Select this option for awards to provide funds to enable investigators to collect preliminary data in preparation for applying for a Standard Research Grant. These awards will be limited to faculty with appointments at small and mid-sized degree-granting institutions that have had limited institutional success and to faculty with appointments at degree-granting institutions eligible for USDA-EPSCoR funding. See the full funding opportunity for the definition of USDA EPSCoR and small and mid-sized institutions.")
  StrengtheningSeed: "Strengthening Seed",

  @doc("Select this option for a standard research project, limited to faculty with appointments at small and mid-sized degree-granting institutions that have had limited institutional success and to faculty with appointments at degree-granting institutions eligible for USDA-EPSCoR funding. See the full funding opportunity for the definition of USDA EPSCoR and small and mid-sized institutions.")
  StrengtheningStandard: "Strengthening Standard",

  @doc("Select this option for a standard multi-institutional project, limited to faculty with appointments at small and mid-sized degree-granting institutions that have had limited institutional success and to faculty with appointments at degree-granting institutions eligible for USDA-EPSCoR funding. See the full funding opportunity for the definition of USDA EPSCoR and small and mid-sized institutions.")
  StrengtheningCAP: "Strengthening CAP",

  @doc("Select this option for scientific meetings that bring together scientists to identify research needs, update information, or advance an area of research.")
  StrengtheningConference: "Strengthening Conference",
}
