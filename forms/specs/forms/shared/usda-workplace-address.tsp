import "simpler-forms";
import "#questions/types/address.tsp";
using SimplerForms;
namespace Forms.USDA;

// Source-specific activity composition of existing address parts. Unlike the generic
// Address question, Province is disabled for USA rather than hidden. The form XSD has
// independently optional sequential State/Province elements, no xs:choice or clear rule.
model USDAWorkplaceAddress {
  @doc("Enter the first line of the Street Address.")
  @UI.label("Street1")
  street1: Questions.Types.AddressParts.Street1;

  @doc("Enter the second line of the Street Address.")
  @UI.label("Street2")
  street2?: Questions.Types.AddressParts.Street2;

  @doc("Enter the City.")
  @UI.label("City")
  city: Questions.Types.AddressParts.City;

  @doc("Enter the County.")
  @UI.label("County")
  county?: Questions.Types.AddressParts.County;

  @doc("Select the Country.")
  @UI.label("Country")
  country: Questions.Types.CountryCode;

  @doc("Select the state, US possession or military code from the provided list.")
  @UI.label("State")
  @UI.enabledWhen(USDAWorkplaceAddress.country, Questions.Types.CountryCode.USA)
  @Validation.requiredWhen(
    USDAWorkplaceAddress.country,
    Questions.Types.CountryCode.USA
  )
  state?: Questions.Types.StateCode;

  @doc("Enter the Province.")
  @UI.label("Province")
  @UI.disabledWhen(
    USDAWorkplaceAddress.country,
    Questions.Types.CountryCode.USA
  )
  province?: Questions.Types.AddressParts.Province;

  @doc("Enter the Postal Code (e.g., ZIP code). This field is required if the Country is United States.")
  @UI.label("Zip / Postal Code")
  @Validation.requiredWhen(
    USDAWorkplaceAddress.country,
    Questions.Types.CountryCode.USA
  )
  zipCode?: Questions.Types.AddressParts.ZipCode;
}
