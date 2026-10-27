import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.PerformanceSites;

@UI.layout(PerformanceSites)
model PerformanceSitesLayout {
  @UI.label("Primary performance site")
  @doc("Identify the primary location where work will be performed. Organization details do not apply when submitting as an individual.")
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
  @doc("Add each other site separately. Address and congressional-district rules apply to that site's country. The overflow reference is available at 299 additional sites or while a reference is already present.")
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
