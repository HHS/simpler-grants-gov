import "simpler-forms";

import "#forms/index.tsp";
import "#questions/person/index.tsp";
import "#questions/types/budget.tsp";
import "#questions/types/yes-no.tsp";

using SimplerForms;

namespace Forms.NasaPIAndAOR;

// =============================================================================
// PEOPLE
// =============================================================================

/** The authorized organization representative (AOR). */
model NasaAuthorizedRepresentative {
  /** Enter the person's name. First and last name are required. */
  @UI.label("Name")
  name: Questions.People.PersonName;

  /** If registered with NSPIRES, enter your username. */
  @UI.label("NSPIRES Username")
  nspiresUsername?: NspiresUsername;
}

/** The principal investigator (PI), and whether they take part as a government or foreign employee. */
model NasaPrincipalInvestigator {
  /** Enter the person's name. First and last name are required. */
  @UI.label("Name")
  name: Questions.People.PersonName;

  @UI.label("Is this person participating in this project as an employee of the U.S. Government?")
  usGovernmentParticipation: Questions.Types.YesNo;

  /** Select a U.S. Government agency from the list provided. */
  @UI.label("If yes, Select U.S. Government agency")
  federalAgency?: NasaFederalAgency;

  /** Enter the total dollar amount. */
  @UI.label("If yes, enter total dollar amount requested ($)")
  federalAgencyDollar?: Questions.Types.BudgetAmount;

  @UI.label("Is this person participating in this project as an employee of a foreign organization?")
  internationalParticipation: Questions.Types.YesNo;
}

// =============================================================================
// ANSWER TYPES
// =============================================================================

// `UserName` in Nasa_PIandAORSupplementalDataSheet-V1.0.xsd.
/** Enter the person's NSPIRES username. */
@maxLength(99)
scalar NspiresUsername extends string;

// `FederalAgencyDataType` in Nasa_PIandAORSupplementalDataSheet-V1.0.xsd.
/** Select a U.S. Government agency. */
enum NasaFederalAgency {
  agencyForInternationalDevelopment: "101: Agency for International Development",
  airForceResearchLaboratory: "102: Air Force Research Laboratory",
  armyResearchLaboratory: "103: Army Research Laboratory",
  centerForDiseaseControlAndPrevention: "104: Center for Disease Control and Prevention",
  coastGuard: "105: Coast Guard",
  customsService: "106: Customs Service",
  defenseAdvancedResearchProjectsAgency: "107: Defense Advanced Research Projects Agency",
  usda: "108: Department of Agriculture (USDA)",
  doc: "109: Department of Commerce (DOC)",
  dod: "110: Department of Defense (DOD)",
  ed: "111: Department of Education (ED)",
  doe: "112: Department of Energy (DOE)",
  hhs: "113: Department of Health and Human Services (HHS)",
  dhs: "114: Department of Homeland Security (DHS)",
  doj: "115: Department of Justice (DOJ)",
  dos: "116: Department of State (DOS)",
  departmentOfTheAirForce: "117: Department of the Air Force",
  departmentOfTheArmy: "118: Department of the Army",
  doi: "119: Department of the Interior (DOI)",
  departmentOfTheNavy: "120: Department of the Navy",
  dot: "121: Department of Transportation (DOT)",
  va: "122: Department of Veterans Affairs (VA)",
  epa: "123: Environmental Protection Agency (EPA)",
  faa: "124: Federal Aviation Administration (FAA)",
  fema: "125: Federal Emergency Management Agency (FEMA)",
  federalMaritimeCommission: "126: Federal Maritime Commission",
  fishAndWildlifeService: "127: Fish and Wildlife Service",
  forestService: "128: Forest Service",
  nasaAmesResearchCenter: "129: NASA Ames Research Center",
  nasaDrydenFlightResearchCenter: "130: NASA Dryden Flight Research Center",
  nasaGlennResearchCenter: "131: NASA Glenn Research Center",
  nasaGoddardSpaceFlightCenter: "132: NASA Goddard Space Flight Center",
  nasaHeadquarters: "133: NASA Headquarters",
  nasaJohnsonSpaceCenter: "134: NASA Johnson Space Center",
  nasaKennedySpaceCenter: "135: NASA Kennedy Space Center",
  nasaLangleyResearchCenter: "136: NASA Langley Research Center",
  nasaMarshallSpaceFlightCenter: "137: NASA Marshall Space Flight Center",
  nasaStennisSpaceCenter: "138: NASA Stennis Space Center",
  nist: "139: National Institute of Standards & Technology (NIST)",
  nih: "140: National Institutes of Health (NIH)",
  noaa: "141: National Oceanic and Atmospheric Administration (NOAA)",
  nationalParkService: "142: National Park Service",
  nsf: "143: National Science Foundation (NSF)",
  navalObservatory: "144: Naval Observatory",
  navalResearchLaboratory: "145: Naval Research Laboratory",
  other: "146: Other",
  smithsonianInstitution: "147: Smithsonian Institution",
  usgs: "148: United States Geological Survey (USGS)",
  unitedStatesMarineCorps: "149: United States Marine Corps",
  walterReedArmyInstituteResearch: "150: Walter Reed Army Institute Research",
}
