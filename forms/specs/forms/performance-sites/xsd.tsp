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
alias SiteAddress = Forms.PerformanceSites.SiteAddress;
alias GlobLib = XSD.GlobLib;
alias Att = XSD.Att;

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
  address: SiteAddressDataType;

  @Mapping.from(grantsGovXml, Site.congressionalDistrict)
  @name("CongressionalDistrictProgramProject")
  @minLength(6)
  @maxLength(6)
  congressionalDistrictProgramProject?: string;
}

/**
 * `globLib:AddressDataTypeV3`, filled from `SiteAddress`. The shared model in
 * `#xsd/global-library.tsp` is filled from `Address`, whose Province a site replaces.
 */
@ns(Namespaces.globLib)
model SiteAddressDataType {
  @Mapping.from(grantsGovXml, SiteAddress.street1)
  @name("Street1")
  street1: string;

  @Mapping.from(grantsGovXml, SiteAddress.street2)
  @name("Street2")
  street2?: string;

  @Mapping.from(grantsGovXml, SiteAddress.city)
  @name("City")
  city: string;

  @Mapping.from(grantsGovXml, SiteAddress.county)
  @name("County")
  county?: string;

  @Mapping.from(grantsGovXml, SiteAddress.state)
  @name("State")
  state?: string;

  @Mapping.from(grantsGovXml, SiteAddress.province)
  @name("Province")
  province?: string;

  @Mapping.from(grantsGovXml, SiteAddress.zipCode)
  @name("ZipPostalCode")
  zipPostalCode?: string;

  @Mapping.from(grantsGovXml, SiteAddress.country)
  @name("Country")
  country: string;
}
