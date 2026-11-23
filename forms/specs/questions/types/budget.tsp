import "simpler-forms";

import "#questions/index.tsp";

using SimplerForms;

namespace Questions.Types;

// `globLib:BudgetAmountDataType`: a decimal from 0 to 999999999999.99 with two decimal places.
// Store the amount as a string, as the API's budget forms do, so no amount is rounded.
/** Enter the amount in dollars, with cents if any. */
@Meta.question(#{ id: "types/budget-amount" })
@Meta.tag(Catalogue.Tag.money)
@UI.label("Amount")
@pattern("^\\d{1,12}([.]\\d{2})?$")
@maxLength(15)
scalar BudgetAmount extends string;
