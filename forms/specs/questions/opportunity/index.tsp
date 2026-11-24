import "simpler-forms";
import "simpler-forms-sgg";
import "#questions/index.tsp";

using SimplerForms;

namespace Questions.Opportunities;

/** The federal agency providing the funding opportunity. */
@Meta.question(#{ id: "opportunity/agency-name" })
@UI.label("Name of Federal Agency")
@minLength(1)
@maxLength(60)
scalar AgencyName extends string;

/** The assistance listing number associated with this competition. */
@Meta.question(#{ id: "opportunity/assistance-listing-number" })
@UI.label("Assistance Listing Number")
@minLength(1)
@maxLength(15)
scalar AssistanceListingNumber extends string;

/** The program title associated with the assistance listing. */
@Meta.question(#{ id: "opportunity/assistance-listing-title" })
@UI.label("Assistance Listing Title")
@minLength(1)
@maxLength(120)
scalar AssistanceListingTitle extends string;

/** The number identifying the funding opportunity. */
@Meta.question(#{ id: "opportunity/number" })
@UI.label("Funding Opportunity Number")
@minLength(1)
@maxLength(40)
scalar OpportunityNumber extends string;

/** The title of the funding opportunity. */
@Meta.question(#{ id: "opportunity/title" })
@UI.label("Funding Opportunity Title")
@minLength(1)
@maxLength(255)
scalar OpportunityTitle extends string;

/** The assistance listing for the funding opportunity. */
@Meta.question(#{ id: "opportunity/assistance-listing" })
@UI.label("Assistance Listing")
model AssistanceListing {
  /** Pre-populated from the application cover sheet. */
  @UI.label("Assistance Listing Number")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.assistanceListingNumber)
  number?: Questions.Opportunities.AssistanceListingNumber;

  /** Pre-populated from the application cover sheet. */
  @UI.label("Assistance Listing Title")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  @Sgg.prePopulate(Sgg.PrePopulationRule.assistanceListingTitle)
  title?: Questions.Opportunities.AssistanceListingTitle;
}

// `globLib:CompetitionIDDataType`
/** The competition identifier for the funding opportunity. */
@Meta.question(#{ id: "opportunity/competition-number" })
@UI.label("Competition Identification Number")
@minLength(1)
@maxLength(40)
scalar CompetitionNumber extends string;

// `globLib:CompetitionTitleDataType`
/** The competition title for the funding opportunity. */
@Meta.question(#{ id: "opportunity/competition-title" })
@UI.label("Competition Identification Title")
@minLength(1)
@maxLength(255)
scalar CompetitionTitle extends string;
