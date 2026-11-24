import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.PerformanceSites;

@UI.layout(PerformanceSites)
model PerformanceSitesLayout {
  /** Identify the primary location where the work will be performed. */
  @UI.label("Project/Performance Site Primary Location")
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

  /** Add each additional site separately. If there are more than 299, attach a file listing the rest. */
  @UI.label("Additional Project/Performance Site Location(s)")
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
