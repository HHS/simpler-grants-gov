import "simpler-forms";

import "#questions/index.tsp";

using SimplerForms;

namespace Questions.Applications;

/** Completed by Grants.gov upon submission. */
@Meta.question(#{ id: "application/date-received" })
@UI.label("Date Received")
scalar DateReceived extends plainDate;

// `globLib:ApplicantIDDataType`
/** Enter the applicant's control number, if applicable. */
@Meta.question(#{ id: "application/applicant-id" })
@Meta.tag(Catalogue.Tag.identifier)
@UI.label("Applicant Identifier")
@minLength(1)
@maxLength(30)
scalar ApplicantId extends string;

// `globLib:FederalIDDataType`
/** Enter the identifier assigned by the federal agency. */
@Meta.question(#{ id: "application/federal-id" })
@Meta.tag(Catalogue.Tag.identifier)
@UI.label("Federal Identifier")
@minLength(1)
@maxLength(30)
scalar FederalId extends string;

// `globLib:ProjectAwardNumberDataType`
/** Enter the previously assigned federal award identifier. */
@Meta.question(#{ id: "application/federal-award-id" })
@Meta.tag(Catalogue.Tag.identifier)
@UI.label("Federal Award Identifier")
@minLength(1)
@maxLength(25)
scalar FederalAwardId extends string;

// `globLib:StateIDDataType`
/** Enter the state application identifier, if applicable. */
@Meta.question(#{ id: "application/state-application-id" })
@Meta.tag(Catalogue.Tag.identifier)
@UI.label("State Application Identifier")
@minLength(1)
@maxLength(30)
scalar StateApplicationId extends string;

/** Leave blank, to be filled out by the state. */
@Meta.question(#{ id: "application/state-received-date" })
@UI.label("Date Received by State")
scalar StateReceivedDate extends plainDate;
