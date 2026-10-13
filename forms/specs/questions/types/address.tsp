import "simpler-forms";

import "#questions/index.tsp";

import "./codes.tsp";

using SimplerForms;

namespace Questions.Types;

/** The parts of an address, one scalar per field. */
namespace AddressParts {
  /** Enter the first line of the street address. */
  @Meta.question(#{ id: "types/address/street-1" })
  @minLength(1)
  @maxLength(55)
  scalar Street1 extends string;

  /** Enter the second line of the street address. */
  @Meta.question(#{ id: "types/address/street-2" })
  @minLength(1)
  @maxLength(55)
  scalar Street2 extends string;

  /** Enter the city. */
  @Meta.question(#{ id: "types/address/city" })
  @minLength(1)
  @maxLength(35)
  scalar City extends string;

  /** Enter the county or parish. */
  @Meta.question(#{ id: "types/address/county" })
  @minLength(1)
  @maxLength(30)
  scalar County extends string;

  /** Enter the province. */
  @Meta.question(#{ id: "types/address/province" })
  @minLength(1)
  @maxLength(30)
  scalar Province extends string;

  /** Enter the zip / postal code. */
  @Meta.question(#{ id: "types/address/zip-code" })
  @minLength(1)
  @maxLength(30)
  scalar ZipCode extends string;
}

// State and Province are alternatives, not independent fields. `AddressDataTypeV3` in
// GlobalLibrary-V2.0.xsd wraps them in an `xs:choice`, so the rule lives on the question
// rather than on each form: State is enabled only for a US address, Province is hidden for one.
// `AddressDataTypeV3` requires Street1, City and Country; Grants.gov requires State and Zip for
// a US address.
/** Enter an address. */
@Meta.question(#{ id: "types/address" })
@Meta.tag(Catalogue.Tag.address)
@UI.label("Address")
@Validation.requiredPathWhen("state", "country", Questions.Types.CountryCode.USA)
@Validation.requiredPathWhen("zipCode", "country", Questions.Types.CountryCode.USA)
model Address {
  /** Enter the first line of the street address. */
  @UI.label("Street1")
  street1: Questions.Types.AddressParts.Street1;

  /** Enter the second line of the street address. */
  @UI.label("Street2")
  street2?: Questions.Types.AddressParts.Street2;

  /** Enter the city. */
  @UI.label("City")
  city: Questions.Types.AddressParts.City;

  /** Enter the county or parish. */
  @UI.label("County/Parish")
  county?: Questions.Types.AddressParts.County;

  /** Select the state. This field is required if the country is the United States. */
  @UI.label("State")
  @UI.enabledWhen(Address.country, Questions.Types.CountryCode.USA)
  state?: Questions.Types.StateCode;

  /** Enter the province. */
  @UI.label("Province")
  @UI.hiddenWhen(Address.country, Questions.Types.CountryCode.USA)
  province?: Questions.Types.AddressParts.Province;

  /** Select the country. */
  @UI.label("Country")
  country: Questions.Types.CountryCode;

  /** Enter the zip / postal code. This field is required if the country is the United States. */
  @UI.label("Zip / Postal Code")
  zipCode?: Questions.Types.AddressParts.ZipCode;
}
