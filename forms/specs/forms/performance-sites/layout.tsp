import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.PerformanceSites;

@UI.layout(PerformanceSites)
model PerformanceSitesLayout {
  @UI.label("Primary performance site")
  @doc("Identify the primary location where the work will be performed.")
  primary: {
    @UI.field(PerformanceSites.primarySite)
    @UI.flatten
    primarySite: {
      submittingAsIndividual: PrimarySite.submittingAsIndividual;
      organizationName: PrimarySite.organizationName;
      uei: PrimarySite.uei;
      @UI.flatten address: PrimarySite.address;
      congressionalDistrict: PrimarySite.congressionalDistrict;
    };
  };

  @UI.label("Additional performance sites")
  @doc("Add each additional site separately. If there are more than 299, attach a file listing the rest.")
  additional: {
    @UI.field(PerformanceSites.additionalSites)
    additionalSites: {
      submittingAsIndividual: Site.submittingAsIndividual;
      organizationName: Site.organizationName;
      uei: Site.uei;
      @UI.flatten address: Site.address;
      congressionalDistrict: Site.congressionalDistrict;
    };
  };

  @UI.label("Additional Locations")
  attachment: {
    additionalLocationsAttachment: PerformanceSites.additionalLocationsAttachment;
  };
}
