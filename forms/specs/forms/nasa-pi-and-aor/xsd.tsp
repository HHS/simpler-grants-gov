import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "#mapping/transforms.tsp";
import "#xsd/global-library.tsp";

import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** Nasa_PIandAORSupplementalDataSheet-V1.0.xsd */
namespace XSD.NasaPIAndAORSupplementalDataSheet10;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Transformation = Mappings.Transforms.Transformation;
alias NasaForm = Forms.NasaPIAndAOR.NasaPIAndAOR;
alias AOR = Forms.NasaPIAndAOR.NasaAuthorizedRepresentative;
alias PI = Forms.NasaPIAndAOR.NasaPrincipalInvestigator;
alias GlobLib = XSD.GlobLib;

// =============================================================================
// ROOT ELEMENT
// =============================================================================

@nsDeclarations
enum Namespaces {
  Nasa_PIandAORSupplementalDataSheet: "http://apply.grants.gov/forms/Nasa_PIandAORSupplementalDataSheet-V1.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}

@name("Nasa_PIandAORSupplementalDataSheet")
@ns(Namespaces.Nasa_PIandAORSupplementalDataSheet)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/Nasa_PIandAORSupplementalDataSheet-V1.0.xsd")
@Mapping.from(grantsGovXml, NasaForm)
model Root {
  @Mapping.from(grantsGovXml, NasaForm.authorizedRepresentative)
  @name("AuthorizedRepresentativeName")
  authorizedRepresentativeName: AuthorizedRepresentativeName;

  @Mapping.from(grantsGovXml, NasaForm.principalInvestigator)
  @name("PrincipalInvestigatorName")
  principalInvestigatorName: PrincipalInvestigatorName;

  @attribute @name("FormVersion") formVersion: "1.0";
}

// =============================================================================
// PEOPLE
// =============================================================================

/** The AOR's name and NSPIRES username. */
@ns(Namespaces.Nasa_PIandAORSupplementalDataSheet)
model AuthorizedRepresentativeName {
  @Mapping.from(grantsGovXml, AOR.name)
  @name("AORName")
  aorName: GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, AOR.nspiresUsername)
  @name("UserName")
  userName?: string;
}

/** The PI's name, and whether they take part as a government or foreign employee. */
@ns(Namespaces.Nasa_PIandAORSupplementalDataSheet)
model PrincipalInvestigatorName {
  @Mapping.from(grantsGovXml, PI.name)
  @name("PDPIName")
  pdpiName: GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, PI.usGovernmentParticipation)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("USGovernmentParticipation")
  usGovernmentParticipation: string;

  @Mapping.from(grantsGovXml, PI.federalAgency)
  @name("FederalAgency")
  federalAgency?: string;

  @Mapping.from(grantsGovXml, PI.federalAgencyDollar)
  @Mapping.transform(Transformation.currencyFormat)
  @name("FederalAgencyDollar")
  federalAgencyDollar?: string;

  @Mapping.from(grantsGovXml, PI.internationalParticipation)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("InternationalParticipation")
  internationalParticipation: string;
}
