import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.HUDOZ;
@UI.layout(HUDOpportunityZoneCertification)
model HUDOpportunityZoneCertificationLayout {
  @UI.label("Applicant and census tracts")
  @doc("View Burden Statement\n\nCertification for Opportunity Zones Preference Points\n\nU.S. Department of Housing and Urban Development \n\nOMB Number: 2501-0044\nExpiration Date: 02/28/2027\n\nType or clearly print the following information.  \n\n**Warning: Anyone who knowingly submits a false claim or makes a false statement is subject to criminal and/or civil penalties, including confinement for up to 5 years, fines, and civil and administrative penalties (18 U.S.C §§ 287, 1001, 1010, 1012, 1014; 31 U.S.C. § 3729, 3802; 24 CFR § 28.10(b)(1)(iii)).  ")
  section0: {
    organizationName: HUDOpportunityZoneCertification.organizationName;
    federalProgram: HUDOpportunityZoneCertification.federalProgram;
    censusTracts: HUDOpportunityZoneCertification.censusTracts;
  };

  @UI.label("Geographic benefit")
  @doc("Note: Projects which substantially and directly benefit Opportunity Zone Census Tracts, but which do not consist of activities delivered within Opportunity Zone Census Tracts may be considered for competitive preference. If applicable, the respective Federal Agency will clearly define “substantially and directly” in the relevant funding announcement.\n\nEstimated Funding Allocations\n\nEstimate a percentage of the total dollar amount of awarded federal funding that would result in a direct benefit within the Opportunity Zone Census Tracts listed above:")
  section1: {
    applicationCriteria: HUDOpportunityZoneCertification.applicationCriteria;
  };

  @UI.label("Funding range and narrative") section2: {
    estimatedFundingAllocations: HUDOpportunityZoneCertification.estimatedFundingAllocations;
    narrative: HUDOpportunityZoneCertification.narrative;
  };

  @UI.label("Nature and purpose of the proposed project")
  @doc("Check the following boxes that accurately reflect the nature or purpose of the proposed project:")
  section3: {
    accessToCapital: HUDOpportunityZoneCertification.accessToCapital;
    assetBuilding: HUDOpportunityZoneCertification.assetBuilding;
    businessAssistance: HUDOpportunityZoneCertification.businessAssistance;
    communityCapacityBuilding: HUDOpportunityZoneCertification.communityCapacityBuilding;
    economicDevelopment: HUDOpportunityZoneCertification.economicDevelopment;
    education: HUDOpportunityZoneCertification.education;
    healthyFoodAccess: HUDOpportunityZoneCertification.healthyFoodAccess;
    health: HUDOpportunityZoneCertification.health;
    housing: HUDOpportunityZoneCertification.housing;
    humanServicesandFamilySupport: HUDOpportunityZoneCertification.humanServicesandFamilySupport;
    communityInfrastructure: HUDOpportunityZoneCertification.communityInfrastructure;
    publicSafety: HUDOpportunityZoneCertification.publicSafety;
    workforceDevelopment: HUDOpportunityZoneCertification.workforceDevelopment;
    lowIncomeHousingTaxCredit: HUDOpportunityZoneCertification.lowIncomeHousingTaxCredit;
    marketRateHousing: HUDOpportunityZoneCertification.marketRateHousing;
    industrialDevelopment: HUDOpportunityZoneCertification.industrialDevelopment;
    commercialDevelopment: HUDOpportunityZoneCertification.commercialDevelopment;
    otherBusinessDevelopment: HUDOpportunityZoneCertification.otherBusinessDevelopment;
    aboveGroundInfrastructure: HUDOpportunityZoneCertification.aboveGroundInfrastructure;
    belowGroundInfrastructure: HUDOpportunityZoneCertification.belowGroundInfrastructure;
    schools: HUDOpportunityZoneCertification.schools;
    hospitals: HUDOpportunityZoneCertification.hospitals;
  };

  @UI.label("Authorized representative and submission")
  @doc("Certification of Authorized Representative for the Applicant:\n\n**Under penalty of perjury, I certify on behalf of the Applicant that\n(1) all information provided on this form is true, complete, and accurate, and\n(2) the Applicant will notify the Agency immediately upon learning of any change in the information provided on this form, and\n(3) I am authorized to speak for the Applicant regarding all information provided on this form. \n\n\nform HUD 2996 (5/2025)")
  section4: {
    authorizedRepresentative: HUDOpportunityZoneCertification.authorizedRepresentative;
    signature: HUDOpportunityZoneCertification.signature;
    signatureDate: HUDOpportunityZoneCertification.signatureDate;
  };
}
