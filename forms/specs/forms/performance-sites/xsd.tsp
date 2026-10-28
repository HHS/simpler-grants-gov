import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "#mapping/transforms.tsp";
import "#xsd/attachments.tsp";
import "#xsd/global-library.tsp";

import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** PerformanceSite_4_0-V4.0.xsd */
namespace XSD.PerformanceSite40;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Transformation = Mappings.Transforms.Transformation;
alias PerformanceSites = Forms.PerformanceSites.PerformanceSites;
alias Site = Forms.PerformanceSites.Site;
alias GlobLib = XSD.GlobLib;
alias Att = XSD.Att;

// =============================================================================
// ROOT ELEMENT
// =============================================================================

@nsDeclarations
enum Namespaces {
  PerformanceSite_4_0: "http://apply.grants.gov/forms/PerformanceSite_4_0-V4.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

@name("PerformanceSite_4_0")
@ns(Namespaces.PerformanceSite_4_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/PerformanceSite_4_0-V4.0.xsd")
@Mapping.from(grantsGovXml, PerformanceSites)
model Root {
  @Mapping.from(grantsGovXml, PerformanceSites.primarySite)
  @name("PrimarySite")
  primarySite: SiteLocationDataType;

  @Mapping.from(grantsGovXml, PerformanceSites.additionalSites)
  @name("OtherSite")
  @maxItems(299)
  otherSite?: SiteLocationDataType[];

  @Mapping.from(grantsGovXml, PerformanceSites.additionalLocationsAttachment)
  @name("AttachedFile")
  attachedFile?: Att.AttachedFileDataType;

  @attribute @name("FormVersion") formVersion: "4.0";
}

// =============================================================================
// SITES
// =============================================================================

// The element names are declared in the form's namespace; only their content types come
// from the global library.
@ns(Namespaces.PerformanceSite_4_0)
model SiteLocationDataType {
  @Mapping.from(grantsGovXml, Site.submittingAsIndividual)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("Individual")
  individual?: string;

  @Mapping.from(grantsGovXml, Site.organizationName)
  @name("OrganizationName")
  organizationName?: string;

  @Mapping.from(grantsGovXml, Site.uei)
  @name("SAMUEI")
  samuei?: string;

  @Mapping.from(grantsGovXml, Site.address)
  @name("Address")
  address: GlobLib.AddressDataTypeV3;

  @Mapping.from(grantsGovXml, Site.congressionalDistrict)
  @name("CongressionalDistrictProgramProject")
  @minLength(6)
  @maxLength(6)
  congressionalDistrictProgramProject?: string;
}
